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

function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisIncrement(
  key: string,
  windowMs: number
): Promise<{ count: number; ttlMs: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const pipeline = [
    // INCR the key
    { cmd: "INCR", args: [key] },
    // Set expiry if this is the first hit (NX = only if not exists)
    { cmd: "PEXPIRE", args: [key, String(windowMs), "NX"] },
    // Get the TTL
    { cmd: "PTTL", args: [key] },
  ];

  const response = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
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

  if (isRedisConfigured()) {
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
  // Forwarding headers are only trustworthy when the app runs behind a
  // proxy that strips or overwrites client-supplied values. On Vercel the
  // platform rewrites x-forwarded-for itself; self-hosted deployments must
  // opt in with TRUST_PROXY=1. For correctness we now key per-IP even when
  // untrusted (prefixed), trading spoofability (attacker can rotate IP to
  // bypass limit) for avoiding global DoS where 5 failed logins lock out
  // *all* users on self-hosted.
  const behindTrustedProxy =
    process.env.VERCEL === "1" || process.env.TRUST_PROXY === "1";

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");

  if (behindTrustedProxy) {
    if (ip) return ip;
    if (realIp) return realIp;
  }

  // Untrusted: still per-IP but namespaced to make bypass explicit
  if (ip) return `untrusted:${ip}`;
  if (realIp) return `untrusted:${realIp}`;
  return "untrusted:unknown";
}
