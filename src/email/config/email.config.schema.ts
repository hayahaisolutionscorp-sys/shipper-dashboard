import * as Joi from 'joi';

// AWS SES Configuration Schema
export const awsConfigSchema = Joi.object({
  region: Joi.string()
    .valid(
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'ap-south-1',
      'ap-northeast-1',
      'ap-northeast-2',
      'ap-northeast-3',
      'ap-southeast-1',
      'ap-southeast-2',
      'ca-central-1',
      'eu-central-1',
      'eu-west-1',
      'eu-west-2',
      'eu-west-3',
      'eu-north-1',
      'sa-east-1',
      'af-south-1',
      'ap-east-1',
      'ap-southeast-3',
      'eu-south-1',
      'me-south-1',
    )
    .required()
    .description('AWS region where SES is configured'),

  accessKeyId: Joi.string()
    .min(16)
    .max(128)
    .pattern(/^[A-Z0-9]+$/)
    .required()
    .description('AWS access key ID'),

  secretAccessKey: Joi.string()
    .min(40)
    .required()
    .description('AWS secret access key'),

  sender: Joi.string()
    .email()
    .required()
    .description('Verified sender email address in AWS SES'),
});

// Redis Configuration Schema
export const redisConfigSchema = Joi.object({
  host: Joi.string()
    .hostname()
    .default('localhost')
    .description('Redis server hostname'),

  port: Joi.number().port().default(6379).description('Redis server port'),

  password: Joi.string()
    .optional()
    .description('Redis password (if authentication is enabled)'),

  db: Joi.number()
    .integer()
    .min(0)
    .max(15)
    .default(0)
    .description('Redis database number'),

  maxmemoryPolicy: Joi.string()
    .valid(
      'noeviction',
      'allkeys-lru',
      'volatile-lru',
      'allkeys-random',
      'volatile-random',
      'volatile-ttl',
    )
    .default('noeviction')
    .description('Redis memory eviction policy'),

  retryDelayOnFailover: Joi.number()
    .integer()
    .min(0)
    .default(100)
    .description('Delay in milliseconds before retrying on failover'),

  enableReadyCheck: Joi.boolean()
    .default(true)
    .description('Enable Redis ready check'),

  maxRetriesPerRequest: Joi.number()
    .integer()
    .min(0)
    .default(3)
    .description('Maximum number of retries per Redis request'),

  lazyConnect: Joi.boolean()
    .default(true)
    .description('Enable lazy connection to Redis'),

  sentinels: Joi.array()
    .items(
      Joi.object({
        host: Joi.string().hostname().required(),
        port: Joi.number().port().required(),
      }),
    )
    .optional()
    .description('Redis Sentinel configuration'),

  name: Joi.string()
    .default('mymaster')
    .description('Redis Sentinel master name'),
});

// Email Configuration Schema
export const emailConfigSchema = Joi.object({
  provider: Joi.string()
    .valid('aws-ses', 'sendgrid', 'mailgun', 'smtp')
    .default('aws-ses')
    .description('Email provider to use'),

  fromEmail: Joi.string()
    .email()
    .optional()
    .description('Default from email address'),
});

// Database Configuration Schema
export const databaseConfigSchema = Joi.object({
  url: Joi.string()
    .uri({
      scheme: ['postgresql', 'postgres', 'mysql', 'sqlite'],
    })
    .required()
    .description('Database connection URL'),
});

// Main Application Configuration Schema
export const appConfigSchema = Joi.object({
  port: Joi.number()
    .port()
    .default(3001)
    .description('Application server port'),

  redis: redisConfigSchema.required(),

  email: emailConfigSchema.required(),

  aws: awsConfigSchema.when('email.provider', {
    is: 'aws-ses',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  database: databaseConfigSchema.required(),
});

// Environment-specific validation
export const developmentConfigSchema = appConfigSchema.keys({
  // Development can have more relaxed validation
  aws: awsConfigSchema.optional(),
});

export const productionConfigSchema = appConfigSchema.keys({
  // Production requires all critical services
  aws: awsConfigSchema.required(),

  redis: redisConfigSchema.keys({
    password: Joi.string()
      .required()
      .description('Redis password is required in production'),
  }),
});

export const testConfigSchema = appConfigSchema.keys({
  // Test environment might use mocks
  aws: awsConfigSchema.optional(),
  database: databaseConfigSchema.optional(),
});

// Validation function
export function validateConfig(
  config: any,
  environment: string = 'development',
) {
  let schema: Joi.ObjectSchema;

  switch (environment) {
    case 'production':
      schema = productionConfigSchema;
      break;
    case 'test':
      schema = testConfigSchema;
      break;
    case 'development':
    default:
      schema = developmentConfigSchema;
      break;
  }

  const result = schema.validate(config, {
    allowUnknown: true, // Allow additional config properties
    stripUnknown: false, // Keep unknown properties
    abortEarly: false, // Show all validation errors
  });

  if (result.error) {
    const errorMessages = result.error.details
      .map((detail) => {
        return `${detail.path.join('.')}: ${detail.message}`;
      })
      .join('\n');

    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }

  return result.value as EmailConfig;
}

// Configuration type inference
export type EmailConfig = {
  port: number;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxmemoryPolicy: string;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    sentinels?: Array<{ host: string; port: number }>;
    name: string;
  };
  email: {
    provider: 'aws-ses' | 'sendgrid' | 'mailgun' | 'smtp';
    fromEmail?: string;
  };
  aws?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    sender: string;
  };
  database: {
    url: string;
  };
};
