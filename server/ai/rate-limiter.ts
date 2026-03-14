import { aiConfig } from "./config";

interface RateBucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, RateBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > aiConfig.rateLimits.authenticated.windowMs) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(userId: string | null, ip: string): { allowed: boolean; remaining: number; resetMs: number } {
  const isGuest = !userId;
  const key = userId || `ip:${ip}`;
  const limits = isGuest ? aiConfig.rateLimits.guest : aiConfig.rateLimits.authenticated;

  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > limits.windowMs) {
    bucket = { count: 0, windowStart: now };
    buckets.set(key, bucket);
  }

  bucket.count++;

  const remaining = Math.max(0, limits.maxRequests - bucket.count);
  const resetMs = bucket.windowStart + limits.windowMs - now;

  if (bucket.count > limits.maxRequests) {
    return { allowed: false, remaining: 0, resetMs };
  }

  return { allowed: true, remaining, resetMs };
}
