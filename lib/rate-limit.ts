// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

// Cleanup probabilístico de entradas expiradas (compatível com serverless)
function cleanupExpired() {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();

  // Cleanup probabilístico (~1% das chamadas)
  if (Math.random() < 0.01) cleanupExpired();

  const entry = rateLimitStore.get(identifier);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Helper to get client identifier from request
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "unknown";
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  chat: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 messages per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 auth attempts per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 API calls per minute
  webhook: { windowMs: 60 * 1000, maxRequests: 1000 }, // Higher limit for webhooks
  signup: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 signup validations per 15 min
  oabVerify: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 OAB verifications per minute
};
