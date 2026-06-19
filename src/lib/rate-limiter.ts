const WINDOW_MS = 60_000;
const MAX_HITS_DEFAULT = 30;

// ── In-Memory Store (fallback when Redis is unavailable) ─────────────────────
type Bucket = { hits: number; resetAt: number };
const memStore = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 300_000;
let lastCleanup = Date.now();

function memCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of memStore) {
    if (bucket.resetAt <= now) memStore.delete(key);
  }
  if (memStore.size > 10_000) {
    const overflow = memStore.size - 10_000;
    let deleted = 0;
    for (const key of memStore.keys()) {
      if (deleted >= overflow) break;
      memStore.delete(key);
      deleted++;
    }
  }
}

// ── Redis (Upstash REST) Store ───────────────────────────────────────────────
// Uses Upstash Redis REST API via fetch — no native dependencies required.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

async function redisIncrement(
  key: string,
  windowMs: number
): Promise<{ count: number; ttlMs: number }> {
  const pipeline = [
    // INCR the key
    { cmd: "INCR", args: [key] },
    // Set expiry if this is the first hit (NX = only if not exists)
    { cmd: "PEXPIRE", args: [key, String(windowMs), "NX"] },
    // Get the TTL
    { cmd: "PTTL", args: [key] },
  ];

  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
  });

  if (!response.ok) {
    throw new Error(`Redis pipeline failed: ${response.status}`);
  }

  const results = await response.json();
  const count = results[0]?.result ?? 1;
  const ttlMs = Math.max(results[2]?.result ?? windowMs, 0);

  return { count, ttlMs };
}

// ── Unified Rate Limiter ─────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  maxHits: number = MAX_HITS_DEFAULT
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();

  if (useRedis) {
    try {
      const { count, ttlMs } = await redisIncrement(`rl:${key}`, WINDOW_MS);
      const resetAt = now + ttlMs;
      const remaining = Math.max(maxHits - count, 0);
      return { allowed: count <= maxHits, remaining, resetAt };
    } catch {
      // Fall through to in-memory if Redis fails
    }
  }

  // In-memory fallback
  const bucket = memStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memStore.set(key, { hits: 1, resetAt: now + WINDOW_MS });
    memCleanup();
    return { allowed: true, remaining: maxHits - 1, resetAt: now + WINDOW_MS };
  }

  bucket.hits += 1;
  const remaining = maxHits - bucket.hits;
  if (bucket.hits > maxHits) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  return { allowed: true, remaining, resetAt: bucket.resetAt };
}

export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}
