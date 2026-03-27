import { HttpError } from "../http.js";

const buckets = new Map();
let lastPrunedAt = 0;

function normalizeIdentifier(identifier) {
  const value = String(identifier || "").trim();
  return value || "anonymous";
}

function pruneBuckets(now) {
  if (now - lastPrunedAt < 60 * 1000) {
    return;
  }

  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }

  lastPrunedAt = now;
}

export function resetPublicRateLimitState() {
  buckets.clear();
  lastPrunedAt = 0;
}

function assertRateLimit({
  scope,
  key,
  identifier,
  limit,
  windowSeconds,
  code,
  message
}) {
  const safeLimit = Number.parseInt(limit, 10);
  const safeWindowSeconds = Number.parseInt(windowSeconds, 10);
  if (!key || !Number.isFinite(safeLimit) || safeLimit <= 0 || !Number.isFinite(safeWindowSeconds) || safeWindowSeconds <= 0) {
    return;
  }

  const now = Date.now();
  pruneBuckets(now);

  const bucketKey = `${scope || "default"}:${key}:${normalizeIdentifier(identifier)}`;
  let entry = buckets.get(bucketKey);
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + safeWindowSeconds * 1000
    };
  }

  if (entry.count >= safeLimit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    throw new HttpError(
      429,
      code,
      message,
      null,
      {
        "Retry-After": String(retryAfterSeconds)
      }
    );
  }

  entry.count += 1;
  buckets.set(bucketKey, entry);
}

export function assertPublicRateLimit(options) {
  assertRateLimit({
    scope: "public",
    ...options
  });
}

export function assertActionRateLimit(options) {
  assertRateLimit({
    scope: "action",
    ...options
  });
}
