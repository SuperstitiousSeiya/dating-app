import { Inject, Injectable, Logger } from "@nestjs/common";
import type { Redis } from "ioredis";

/**
 * Typed Redis service wrapping ioredis.
 * All cache operations live here — never call the Redis client directly in feature modules.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Failed to parse JSON from Redis key: ${key}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, "EX", ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /** Publishes a message to a Redis channel. */
  async publish(channel: string, message: string): Promise<void> {
    await this.redis.publish(channel, message);
  }

  /** Returns a dedicated connection for subscriber use (subscribe blocks the connection). */
  getDuplicateClient(): Redis {
    return this.redis.duplicate();
  }

  /** Raw client access — use sparingly and only for operations not covered above. */
  get client(): Redis {
    return this.redis;
  }
}
