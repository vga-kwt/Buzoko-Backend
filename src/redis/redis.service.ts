import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class RedisService implements OnModuleInit {
  // definite assignment assertion because we initialize in onModuleInit()
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    const url = process.env.REDIS_URL;
    if (url) {
      // Avoid logging credentials
      const safeUrl = url.replace(/:\w+@/, ':***@');
      this.logger.log(`Connecting to Redis via URL: ${safeUrl}`);
      this.client = new Redis(url as string);
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const options: RedisOptions = { host, port };
      this.logger.log(`Connecting to Redis at ${host}:${port}`);
      this.client = new Redis(options);
    }

    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  // Ensure callers never use an uninitialized client
  private getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized yet.');
    }
    return this.client;
  }

  getClientInstance(): Redis {
    return this.getClient();
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const c = this.getClient();
    if (ttlSeconds) {
      return c.set(key, value, 'EX', ttlSeconds);
    }
    return c.set(key, value);
  }

  async get(key: string) {
    return this.getClient().get(key);
  }

  async del(key: string) {
    return this.getClient().del(key);
  }

  async incr(key: string) {
    return this.getClient().incr(key);
  }

  async expire(key: string, seconds: number) {
    return this.getClient().expire(key, seconds);
  }

  async ttl(key: string) {
    return this.getClient().ttl(key);
  }
}
