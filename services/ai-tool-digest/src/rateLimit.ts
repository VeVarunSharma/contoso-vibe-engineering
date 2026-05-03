/**
 * In-memory per-IP rate limiter for the Azure Function HTTP trigger.
 *
 * The function is already protected by `authLevel: "function"` (function
 * key required), but key holders can still hammer the endpoint, so we add
 * a coarse-grained throttle as defence-in-depth.
 *
 * PRODUCTION TODO: in a multi-instance deployment, replace this with an
 * Azure Front Door / API Management policy or a distributed limiter backed
 * by Redis. The in-memory map only protects a single Function instance.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 1000;
const LIMIT = 30;

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  if (!key) {
    key = "unknown";
  }

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return { allowed: true, remaining: LIMIT - 1, resetAt: fresh.resetAt };
  }

  if (existing.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: LIMIT - existing.count,
    resetAt: existing.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function __resetBuckets(): void {
  buckets.clear();
}
