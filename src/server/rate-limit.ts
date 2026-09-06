import { Redis } from "@upstash/redis";

type Bucket = Map<string, number[]>;

const memoryBuckets = new Map<string, Bucket>();

let redisClient: Redis | null | undefined;

function memoryBucket(scope: string) {
  let bucket = memoryBuckets.get(scope);
  if (!bucket) {
    bucket = new Map();
    memoryBuckets.set(scope, bucket);
  }
  return bucket;
}

function memoryRecent(scope: string, key: string, windowMs: number) {
  const bucket = memoryBucket(scope);
  const now = Date.now();
  const recent = (bucket.get(key) ?? []).filter((t) => now - t < windowMs);
  bucket.set(key, recent);
  return recent;
}

function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

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

function redisKey(scope: string, key: string) {
  return `rl:${scope}:${key}`;
}

/** True when the key is already over the limit (does not record a new hit). */
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

/** Record one hit. Returns true if the key is now over the limit. */
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

export async function clearRateLimit(scope: string, key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memoryBucket(scope).delete(key);
    return;
  }
  await redis.del(redisKey(scope, key));
}

/**
 * Sliding-window helper that records a hit and reports whether limited.
 * Prefer isRateLimited + recordRateLimitHit when only failures should count.
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
