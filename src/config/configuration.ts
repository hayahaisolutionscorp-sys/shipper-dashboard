import {
  validateConfig,
  type EmailConfig,
} from '../email/email/config/email.config.schema';

export default (): EmailConfig => {
  const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryDelayOnFailover: parseInt(
        process.env.REDIS_RETRY_DELAY || '100',
        10,
      ),
      enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false',
      maxmemoryPolicy: process.env.REDIS_MAXMEMORY_POLICY || 'noeviction',
      sentinels: process.env.REDIS_SENTINELS
        ? process.env.REDIS_SENTINELS.split(',').map((s) => {
            const [host, port] = s.split(':');
            return { host, port: parseInt(port, 10) };
          })
        : undefined,
      name: process.env.REDIS_MASTER_NAME || 'mymaster',
    },
    email: {
      provider:
        (process.env.EMAIL_PROVIDER as
          | 'aws-ses'
          | 'sendgrid'
          | 'mailgun'
          | 'smtp') || 'aws-ses',
      fromEmail: process.env.AWS_SES_FROM_EMAIL,
    },
    aws: process.env.AWS_REGION
      ? {
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sender: process.env.AWS_SES_SENDER!,
        }
      : undefined,
    database: {
      url: process.env.DATABASE_URL!,
    },
  };

  // Validate configuration on load
  const environment = process.env.NODE_ENV || 'development';
  try {
    return validateConfig(config, environment);
  } catch (error) {
    console.error('❌ Configuration validation failed:');
    console.error(error instanceof Error ? error.message : String(error));

    // In development, we might want to continue with invalid config for debugging
    if (environment === 'development') {
      console.warn(
        '⚠️  Continuing with invalid configuration in development mode',
      );
      return config as EmailConfig;
    }

    // In production, we should exit
    process.exit(1);
  }
};