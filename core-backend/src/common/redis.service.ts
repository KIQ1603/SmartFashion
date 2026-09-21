import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: false, maxRetriesPerRequest: 1 });
    this.on('error', (err) => {
      // Không để lỗi Redis làm crash toàn bộ service - chỉ log, các nơi dùng cache đều có fallback.
      // eslint-disable-next-line no-console
      console.error('[Redis] connection error:', err.message);
    });
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: unknown, ttlSeconds: number) {
    try {
      await this.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // ignore cache write failure
    }
  }
}
