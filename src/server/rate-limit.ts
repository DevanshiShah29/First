import { Redis } from "@upstash/redis";

type Bucket = Map<string, number[]>;

const memoryBuckets = new Map<string, Bucket>();

let redisClient: Redis | null | undefined;

/**
 * Gets or creates an in-memory bucket map for a scope.
 * @example memoryBucket("login") // Map
 */
function memoryBucket(scope: string) {
  let bucket = memoryBuckets.get(scope);
  if (!bucket) {
    bucket = new Map();
    memoryBuckets.set(scope, bucket);
  }
  return bucket;
}

/**
 * Returns timestamps still inside the window for a key.
 * @example memoryRecent(scope, key, 60000) // [t1, t2]
 */
function memoryRecent(scope: string, key: string, windowMs: number) {
  const bucket = memoryBucket(scope);
  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((t) => now - t < windowMs);
  bucket.set(key, recent);
  return recent;
}

/**
 * True when Upstash Redis env vars are set.
 * @example redisConfigured() // true
 */
function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/**
 * Lazily creates the shared Upstash Redis client or null.
 * @example getRedis() // Redis | null
 */
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  if (!redisConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing — rate limits are in-memory only and will not hold across instances.",
      );
    }
    redisClient = null;
    return null;
  }
  redisClient = Redis.fromEnv();
  return redisClient;
}

/**
 * Builds a Redis key for a rate-limit bucket.
 * @example redisKey("login", "1.2.3.4") // "rl:login:1.2.3.4"
 */
function redisKey(scope: string, key: string) {
  return `rl:${scope}:${key}`;
}

/**
 * True when the key is already over the limit (no new hit).
 * @example await isRateLimited(scope, key, 5, 60000) // false
 */
export async function isRateLimited(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return memoryRecent(scope, key, windowMs).length >= max;
  }

  const id = redisKey(scope, key);
  const now = Date.now();
  const min = now - windowMs;
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(id, 0, min);
  pipeline.zcard(id);
  const results = await pipeline.exec();
  const count = Number(results[1] ?? 0);
  return count >= max;
}

/**
 * Records one hit; true if now over the limit.
 * @example await recordRateLimitHit(scope, key, 5, 60000) // false
 */
export async function recordRateLimitHit(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    const recent = memoryRecent(scope, key, windowMs);
    recent.push(Date.now());
    memoryBucket(scope).set(key, recent);
    return recent.length >= max;
  }

  const id = redisKey(scope, key);
  const now = Date.now();
  const min = now - windowMs;
  const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(id, 0, min);
  pipeline.zadd(id, { score: now, member });
  pipeline.zcard(id);
  pipeline.pexpire(id, windowMs);
  const results = await pipeline.exec();
  const count = Number(results[2] ?? 0);
  return count >= max;
}

/**
 * Clears rate-limit hits for a scope/key.
 * @example await clearRateLimit("login", ip) // void
 */
export async function clearRateLimit(scope: string, key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memoryBucket(scope).delete(key);
    return;
  }
  await redis.del(redisKey(scope, key));
}

/**
 * Records a hit and reports whether limited.
 * @example await rateLimited(scope, key, 5, 60000) // false
 */
export async function rateLimited(
  scope: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  if (await isRateLimited(scope, key, max, windowMs)) return true;
  return recordRateLimitHit(scope, key, max, windowMs);
}
