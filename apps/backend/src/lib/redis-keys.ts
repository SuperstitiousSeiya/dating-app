/**
 * Centralized Redis key builders.
 * ALL Redis keys must be constructed through this module — no inline strings in services.
 * This prevents typos, enables easy searching, and documents TTLs alongside keys.
 */

export const RedisKeys = {
  /** Discovery feed deck for a user. TTL: 5 min */
  feed: (userId: string) => `feed:${userId}`,

  /** Public profile cache. TTL: 10 min */
  profile: (userId: string) => `profile:${userId}`,

  /** Sorted match list. TTL: 1 min */
  matchList: (userId: string) => `match-list:${userId}`,

  /** Unread message count. TTL: 30s */
  unreadCount: (userId: string) => `unread-count:${userId}`,

  /** Active refresh token hash tracker. TTL: 30 days */
  refreshSession: (userId: string) => `session:refresh:${userId}`,

  /** Email OTP for verification. TTL: 10 min */
  emailOtp: (userId: string) => `otp:email:${userId}`,

  /** Password reset token. TTL: 1 hour */
  passwordReset: (token: string) => `reset:${token}`,

  /** Online presence marker. TTL: 60s (renewed on heartbeat) */
  presence: (userId: string) => `presence:${userId}`,

  /** Rate limit counter. TTL: varies by rule */
  rateLimit: (ip: string, route: string) => `rate:${ip}:${route}`,
} as const;

export const RedisTTL = {
  FEED: 5 * 60,
  PROFILE: 10 * 60,
  MATCH_LIST: 60,
  UNREAD_COUNT: 30,
  REFRESH_SESSION: 30 * 24 * 60 * 60,
  EMAIL_OTP: 10 * 60,
  PASSWORD_RESET: 60 * 60,
  PRESENCE: 60,
} as const;
