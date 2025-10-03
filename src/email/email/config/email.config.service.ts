import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateConfig, EmailConfig } from './email.config.schema';

@Injectable()
export class EmailConfigService {
  private readonly logger = new Logger(EmailConfigService.name);
  private validatedConfig: EmailConfig;

  constructor(private configService: ConfigService) {
    this.validateAndCacheConfig();
  }

  /**
   * Get the validated configuration
   */
  getConfig(): EmailConfig {
    return this.validatedConfig;
  }

  /**
   * Get AWS configuration (throws if not configured)
   */
  getAwsConfig(): NonNullable<EmailConfig['aws']> {
    if (!this.validatedConfig.aws) {
      throw new Error('AWS configuration is not available');
    }
    return this.validatedConfig.aws;
  }

  /**
   * Get Redis configuration
   */
  getRedisConfig(): EmailConfig['redis'] {
    return this.validatedConfig.redis;
  }

  /**
   * Get Email configuration
   */
  getEmailConfig(): EmailConfig['email'] {
    return this.validatedConfig.email;
  }

  /**
   * Get Database configuration
   */
  getDatabaseConfig(): EmailConfig['database'] {
    return this.validatedConfig.database;
  }

  /**
   * Check if AWS is properly configured
   */
  isAwsConfigured(): boolean {
    return !!this.validatedConfig.aws;
  }

  /**
   * Check if Redis is properly configured
   */
  isRedisConfigured(): boolean {
    const redis = this.validatedConfig.redis;
    return !!(redis.host && redis.port);
  }

  /**
   * Check if database is properly configured
   */
  isDatabaseConfigured(): boolean {
    return !!this.validatedConfig.database.url;
  }

  /**
   * Get configuration summary for health checks
   */
  getConfigSummary() {
    return {
      email: {
        provider: this.validatedConfig.email.provider,
        fromEmailConfigured: !!this.validatedConfig.email.fromEmail,
      },
      aws: {
        configured: this.isAwsConfigured(),
        region: this.validatedConfig.aws?.region,
        senderConfigured: !!this.validatedConfig.aws?.sender,
      },
      redis: {
        configured: this.isRedisConfigured(),
        host: this.validatedConfig.redis.host,
        port: this.validatedConfig.redis.port,
        passwordConfigured: !!this.validatedConfig.redis.password,
        maxmemoryPolicy: this.validatedConfig.redis.maxmemoryPolicy,
      },
      database: {
        configured: this.isDatabaseConfigured(),
        // Don't expose the full URL for security
        hasUrl: !!this.validatedConfig.database.url,
      },
    };
  }

  /**
   * Validate and cache configuration on startup
   */
  private validateAndCacheConfig(): void {
    try {
      const environment = process.env.NODE_ENV || 'development';

      // Build config object from environment variables
      const config = {
        port: this.configService.get<number>('PORT', 3001),
        redis: {
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
          maxmemoryPolicy: this.configService.get<string>(
            'REDIS_MAXMEMORY_POLICY',
            'noeviction',
          ),
          retryDelayOnFailover: this.configService.get<number>(
            'REDIS_RETRY_DELAY',
            100,
          ),
          enableReadyCheck: this.configService.get<boolean>(
            'REDIS_ENABLE_READY_CHECK',
            true,
          ),
          maxRetriesPerRequest: this.configService.get<number>(
            'REDIS_MAX_RETRIES',
            3,
          ),
          lazyConnect: this.configService.get<boolean>(
            'REDIS_LAZY_CONNECT',
            true,
          ),
          sentinels: this.parseSentinels(
            this.configService.get<string>('REDIS_SENTINELS'),
          ),
          name: this.configService.get<string>('REDIS_MASTER_NAME', 'mymaster'),
        },
        email: {
          provider: this.configService.get<string>('EMAIL_PROVIDER', 'aws-ses'),
          fromEmail: this.configService.get<string>('AWS_SES_FROM_EMAIL'),
        },
        aws: this.configService.get<string>('AWS_REGION')
          ? {
              region: this.configService.get<string>('AWS_REGION'),
              accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
              secretAccessKey: this.configService.get<string>(
                'AWS_SECRET_ACCESS_KEY',
              ),
              sender: this.configService.get<string>('AWS_SES_SENDER'),
            }
          : undefined,
        database: {
          url: this.configService.get<string>('DATABASE_URL'),
        },
      };

      // Validate the configuration
      this.validatedConfig = validateConfig(config, environment);

      this.logger.log('Configuration validated successfully');
      this.logger.log('Configuration summary:', this.getConfigSummary());
    } catch (error) {
      this.logger.error('Configuration validation failed:', error);
      throw error;
    }
  }

  /**
   * Parse Redis sentinels from environment variable
   */
  private parseSentinels(
    sentinelsString?: string,
  ): Array<{ host: string; port: number }> | undefined {
    if (!sentinelsString) {
      return undefined;
    }

    try {
      return sentinelsString.split(',').map((sentinel) => {
        const [host, portStr] = sentinel.trim().split(':');
        const port = parseInt(portStr, 10);

        if (!host || isNaN(port)) {
          throw new Error(`Invalid sentinel format: ${sentinel}`);
        }

        return { host, port };
      });
    } catch (error) {
      this.logger.warn('Failed to parse Redis sentinels:', error);
      return undefined;
    }
  }

  /**
   * Validate configuration at runtime (useful for health checks)
   */
  validateRuntimeConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check AWS configuration if provider is aws-ses
    if (this.validatedConfig.email.provider === 'aws-ses') {
      if (!this.isAwsConfigured()) {
        errors.push(
          'AWS SES is selected as email provider but AWS configuration is missing',
        );
      }
    }

    // Check Redis configuration
    if (!this.isRedisConfigured()) {
      errors.push('Redis configuration is incomplete');
    }

    // Check database configuration
    if (!this.isDatabaseConfigured()) {
      errors.push('Database configuration is missing');
    }

    // Production-specific checks
    if (process.env.NODE_ENV === 'production') {
      if (!this.validatedConfig.redis.password) {
        warnings.push('Redis password is not set in production environment');
      }

      if (this.validatedConfig.redis.maxmemoryPolicy !== 'noeviction') {
        warnings.push(
          'Redis maxmemory-policy should be "noeviction" for queue reliability',
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
