type Bucket = Map<string, number[]>;

const buckets = new Map<string, Bucket>();

function bucketFor(scope: string) {
  let bucket = buckets.get(scope);
  if (!bucket) {
    bucket = new Map();
    buckets.set(scope, bucket);
  }
  return bucket;
}

function recentHits(scope: string, key: string, windowMs: number) {
  const bucket = bucketFor(scope);
  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((t) => now - t < windowMs);
  bucket.set(key, recent);
  return recent;
}

/** True when the key is already over the limit (does not record a new hit). */
export function isRateLimited(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  return recentHits(scope, key, windowMs).length >= max;
}

/** Record one hit. Returns true if the key is now over the limit. */
export function recordRateLimitHit(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const recent = recentHits(scope, key, windowMs);
  recent.push(Date.now());
  bucketFor(scope).set(key, recent);
  return recent.length >= max;
}

export function clearRateLimit(scope: string, key: string) {
  bucketFor(scope).delete(key);
}

/**
 * Sliding-window helper that records a hit and reports whether limited.
 * Prefer isRateLimited + recordRateLimitHit when only failures should count.
 */
export function rateLimited(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  if (isRateLimited(scope, key, max, windowMs)) return true;
  return recordRateLimitHit(scope, key, max, windowMs);
}
