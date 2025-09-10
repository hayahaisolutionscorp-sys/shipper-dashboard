import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all email-related exceptions
 */
export abstract class EmailException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly errorCode: string = 'EMAIL_ERROR',
    public readonly context?: Record<string, any>,
  ) {
    super(
      {
        message,
        errorCode,
        context,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

/**
 * Configuration-related email exceptions
 */
export class EmailConfigurationException extends EmailException {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly missingFields?: string[],
  ) {
    super(
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'EMAIL_CONFIGURATION_ERROR',
      {
        provider,
        missingFields,
      },
    );
  }
}

/**
 * Email delivery failures
 */
export class EmailDeliveryException extends EmailException {
  constructor(
    message: string,
    public readonly recipient: string,
    public readonly provider: string,
    public readonly originalError?: Error,
    public readonly retryable: boolean = true,
  ) {
    super(message, HttpStatus.BAD_GATEWAY, 'EMAIL_DELIVERY_ERROR', {
      recipient,
      provider,
      retryable,
      originalError: originalError?.message,
    });
  }
}

/**
 * Template-related exceptions
 */
export class EmailTemplateException extends EmailException {
  constructor(
    message: string,
    public readonly templateName: string,
    public readonly missingVariables?: string[],
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'EMAIL_TEMPLATE_ERROR', {
      templateName,
      missingVariables,
    });
  }
}

/**
 * Queue-related exceptions
 */
export class EmailQueueException extends EmailException {
  constructor(
    message: string,
    public readonly queueName: string,
    public readonly operation: string,
  ) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, 'EMAIL_QUEUE_ERROR', {
      queueName,
      operation,
    });
  }
}

/**
 * Rate limiting exceptions
 */
export class EmailRateLimitException extends EmailException {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly limit: number,
    public readonly resetTime?: Date,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'EMAIL_RATE_LIMIT_ERROR', {
      provider,
      limit,
      resetTime: resetTime?.toISOString(),
    });
  }
}

/**
 * Validation exceptions for email content
 */
export class EmailValidationException extends EmailException {
  constructor(
    message: string,
    public readonly validationErrors: string[],
    public readonly field?: string,
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'EMAIL_VALIDATION_ERROR', {
      validationErrors,
      field,
    });
  }
}

/**
 * Provider health check exceptions
 */
export class EmailProviderHealthException extends EmailException {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly healthStatus: 'unhealthy' | 'degraded',
  ) {
    super(
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      'EMAIL_PROVIDER_HEALTH_ERROR',
      {
        provider,
        healthStatus,
      },
    );
  }
}

/**
 * Attachment-related exceptions
 */
export class EmailAttachmentException extends EmailException {
  constructor(
    message: string,
    public readonly filename: string,
    public readonly reason: 'size_limit' | 'invalid_type' | 'corrupted',
    public readonly maxSize?: number,
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'EMAIL_ATTACHMENT_ERROR', {
      filename,
      reason,
      maxSize,
    });
  }
}

/**
 * Bulk email operation exceptions
 */
export class EmailBulkOperationException extends EmailException {
  constructor(
    message: string,
    public readonly totalEmails: number,
    public readonly failedEmails: number,
    public readonly errors: string[],
  ) {
    super(message, HttpStatus.PARTIAL_CONTENT, 'EMAIL_BULK_OPERATION_ERROR', {
      totalEmails,
      failedEmails,
      successfulEmails: totalEmails - failedEmails,
      errors,
    });
  }
}

/**
 * Schedule-related exceptions
 */
export class EmailScheduleException extends EmailException {
  constructor(
    message: string,
    public readonly scheduledTime: string,
    public readonly reason: 'past_time' | 'too_far_future' | 'invalid_format',
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'EMAIL_SCHEDULE_ERROR', {
      scheduledTime,
      reason,
    });
  }
}

/**
 * Utility function to create appropriate email exception based on error type
 */
export function createEmailException(
  error: Error,
  context?: Record<string, unknown>,
): EmailException {
  // AWS SES specific errors
  if (error.message.includes('MessageRejected')) {
    return new EmailDeliveryException(
      'Email rejected by provider',
      typeof context?.recipient === 'string' ? context.recipient : 'unknown',
      typeof context?.provider === 'string' ? context.provider : 'aws-ses',
      error,
      false, // Not retryable
    );
  }

  if (error.message.includes('Throttling')) {
    return new EmailRateLimitException(
      'Rate limit exceeded',
      typeof context?.provider === 'string' ? context.provider : 'aws-ses',
      typeof context?.limit === 'number' ? context.limit : 14,
      context?.resetTime instanceof Date ? context.resetTime : undefined,
    );
  }

  if (error.message.includes('InvalidParameterValue')) {
    return new EmailValidationException(
      'Invalid email parameters',
      [error.message],
      context?.field as string | undefined,
    );
  }

  // Configuration errors
  if (error.message.includes('Missing required AWS SES configuration')) {
    return new EmailConfigurationException(
      error.message,
      'aws-ses',
      context?.missingFields as string[] | undefined,
    );
  }

  // Queue errors
  if (error.message.includes('Redis') || error.message.includes('queue')) {
    return new EmailQueueException(
      error.message,
      typeof context?.queueName === 'string'
        ? context.queueName
        : 'email-queue',
      typeof context?.operation === 'string' ? context.operation : 'unknown',
    );
  }

  // Template errors
  if (
    error.message.includes('template') ||
    error.message.includes('Template')
  ) {
    return new EmailTemplateException(
      error.message,
      typeof context?.templateName === 'string'
        ? context.templateName
        : 'unknown',
      Array.isArray(context?.missingVariables)
        ? context.missingVariables
        : undefined,
    );
  }

  // Generic email exception as fallback
  return new (class extends EmailException {
    constructor() {
      super(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'EMAIL_UNKNOWN_ERROR',
        context,
      );
    }
  })();
}

/**
 * Error codes for easier error handling in clients
 */
export const EMAIL_ERROR_CODES = {
  CONFIGURATION_ERROR: 'EMAIL_CONFIGURATION_ERROR',
  DELIVERY_ERROR: 'EMAIL_DELIVERY_ERROR',
  TEMPLATE_ERROR: 'EMAIL_TEMPLATE_ERROR',
  QUEUE_ERROR: 'EMAIL_QUEUE_ERROR',
  RATE_LIMIT_ERROR: 'EMAIL_RATE_LIMIT_ERROR',
  VALIDATION_ERROR: 'EMAIL_VALIDATION_ERROR',
  PROVIDER_HEALTH_ERROR: 'EMAIL_PROVIDER_HEALTH_ERROR',
  ATTACHMENT_ERROR: 'EMAIL_ATTACHMENT_ERROR',
  BULK_OPERATION_ERROR: 'EMAIL_BULK_OPERATION_ERROR',
  SCHEDULE_ERROR: 'EMAIL_SCHEDULE_ERROR',
  UNKNOWN_ERROR: 'EMAIL_UNKNOWN_ERROR',
} as const;

export type EmailErrorCode =
  (typeof EMAIL_ERROR_CODES)[keyof typeof EMAIL_ERROR_CODES];
