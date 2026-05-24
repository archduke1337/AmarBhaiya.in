const WINDOW_MS = 60_000;
const MAX_HITS_DEFAULT = 30;

type Bucket = { hits: number; resetAt: number };
const store = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 300_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
  if (store.size > 10_000) {
    const overflow = store.size - 10_000;
    let deleted = 0;
    for (const key of store.keys()) {
      if (deleted >= overflow) break;
      store.delete(key);
      deleted++;
    }
  }
}

export function checkRateLimit(
  key: string,
  maxHits: number = MAX_HITS_DEFAULT
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { hits: 1, resetAt: now + WINDOW_MS });
    cleanup();
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
  return `rl:${ip}`;
}
