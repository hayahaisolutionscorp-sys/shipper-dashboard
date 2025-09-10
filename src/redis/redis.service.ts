import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig = this.configService.get('redis') as {
      sentinels?: Array<{ host: string; port: number }>;
      name?: string;
      host?: string;
      port?: number;
      password?: string;
      db?: number;
      enableReadyCheck?: boolean;
      maxRetriesPerRequest?: number;
      lazyConnect?: boolean;
    };

    if (redisConfig?.sentinels && redisConfig.sentinels.length > 0) {
      // Redis Sentinel setup for high availability
      this.client = new Redis({
        sentinels: redisConfig.sentinels,
        name: redisConfig.name || 'mymaster',
        password: redisConfig.password,
        db: redisConfig.db || 0,
        enableReadyCheck: redisConfig.enableReadyCheck ?? true,
        maxRetriesPerRequest: redisConfig.maxRetriesPerRequest ?? 3,
        lazyConnect: redisConfig.lazyConnect ?? true,
      });
      this.logger.log('Redis Sentinel connection configured');
    } else {
      // Single Redis instance
      this.client = new Redis({
        host: redisConfig?.host || 'localhost',
        port: redisConfig?.port || 6379,
        password: redisConfig?.password,
        db: redisConfig?.db || 0,
        enableReadyCheck: redisConfig?.enableReadyCheck ?? true,
        maxRetriesPerRequest: redisConfig?.maxRetriesPerRequest ?? 3,
        lazyConnect: redisConfig?.lazyConnect ?? true,
      });
      this.logger.log(
        `Redis connection configured: ${redisConfig?.host || 'localhost'}:${redisConfig?.port || 6379}`,
      );
    }

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}
