import { Injectable, Logger } from '@nestjs/common';
import {
  EmailException,
  createEmailException,
  EmailDeliveryException,
  EmailRateLimitException,
  EmailConfigurationException,
  EmailQueueException,
} from './email.exceptions';

export interface ErrorContext {
  operation: string;
  provider?: string;
  recipient?: string;
  templateName?: string;
  queueName?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface ErrorMetrics {
  errorType: string;
  provider?: string;
  count: number;
  lastOccurred: Date;
  averageRecoveryTime?: number;
}

@Injectable()
export class EmailErrorHandler {
  private readonly logger = new Logger(EmailErrorHandler.name);
  private errorMetrics = new Map<string, ErrorMetrics>();

  /**
   * Handle and transform errors into appropriate EmailExceptions
   */
  handleError(error: Error, context: ErrorContext): EmailException {
    const emailException = createEmailException(error, context);

    // Log the error with context
    this.logError(emailException, context);

    // Update error metrics
    this.updateErrorMetrics(emailException, context);

    // Determine if error should trigger alerts
    this.checkForCriticalErrors(emailException, context);

    return emailException;
  }

  /**
   * Handle async errors that occur outside of request context
   */
  async handleAsyncError(
    error: Error,
    context: ErrorContext,
    retryCallback?: () => Promise<void>,
  ): Promise<void> {
    const emailException = this.handleError(error, context);

    // For certain errors, attempt retry
    if (this.shouldRetry(emailException) && retryCallback) {
      try {
        await this.retryWithBackoff(retryCallback, context);
      } catch (retryError) {
        this.logger.error('Retry failed:', retryError);
      }
    }
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values());
  }

  /**
   * Reset error metrics (useful for testing or periodic cleanup)
   */
  resetErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Check if the system is in a degraded state based on error patterns
   */
  isSystemDegraded(): boolean {
    const recentErrors = this.getRecentErrors(5 * 60 * 1000); // Last 5 minutes
    const errorCount = recentErrors.reduce(
      (sum, metric) => sum + metric.count,
      0,
    );

    // Consider system degraded if more than 10 errors in 5 minutes
    return errorCount > 10;
  }

  /**
   * Get health status based on error patterns
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    errorCount: number;
    criticalErrors: number;
    lastError?: Date;
  } {
    const recentErrors = this.getRecentErrors(10 * 60 * 1000); // Last 10 minutes
    const errorCount = recentErrors.reduce(
      (sum, metric) => sum + metric.count,
      0,
    );
    const criticalErrors = recentErrors.filter(
      (metric) =>
        metric.errorType.includes('CONFIGURATION') ||
        metric.errorType.includes('QUEUE'),
    ).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (criticalErrors > 0) {
      status = 'unhealthy';
    } else if (errorCount > 5) {
      status = 'degraded';
    }

    const lastError =
      recentErrors.length > 0
        ? Math.max(...recentErrors.map((e) => e.lastOccurred.getTime()))
        : undefined;

    return {
      status,
      errorCount,
      criticalErrors,
      lastError: lastError ? new Date(lastError) : undefined,
    };
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(error: EmailException, context: ErrorContext): void {
    const logMessage = `${error.errorCode}: ${error.message}`;
    const logContext = {
      ...context,
      errorCode: error.errorCode,
      statusCode: error.getStatus(),
      context: error.context,
    };

    // Determine log level based on error type
    if (this.isCriticalError(error)) {
      this.logger.error(logMessage, logContext);
    } else if (this.isWarningError(error)) {
      this.logger.warn(logMessage, logContext);
    } else {
      this.logger.log(logMessage, logContext);
    }
  }

  /**
   * Update error metrics for monitoring
   */
  private updateErrorMetrics(
    error: EmailException,
    context: ErrorContext,
  ): void {
    const key = `${error.errorCode}_${context.provider || 'unknown'}`;
    const existing = this.errorMetrics.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurred = new Date();
    } else {
      this.errorMetrics.set(key, {
        errorType: error.errorCode,
        provider: context.provider,
        count: 1,
        lastOccurred: new Date(),
      });
    }
  }

  /**
   * Check for critical error patterns that need immediate attention
   */
  private checkForCriticalErrors(
    error: EmailException,
    context: ErrorContext,
  ): void {
    // Alert on configuration errors
    if (error instanceof EmailConfigurationException) {
      this.logger.error('🚨 CRITICAL: Email configuration error detected', {
        provider: error.provider,
        missingFields: error.missingFields,
        context,
      });
    }

    // Alert on queue failures
    if (error instanceof EmailQueueException) {
      this.logger.error('🚨 CRITICAL: Email queue error detected', {
        queueName: error.queueName,
        operation: error.operation,
        context,
      });
    }

    // Alert on repeated delivery failures
    const deliveryErrorKey = `EMAIL_DELIVERY_ERROR_${context.provider}`;
    const deliveryErrors = this.errorMetrics.get(deliveryErrorKey);
    if (deliveryErrors && deliveryErrors.count > 5) {
      this.logger.error('🚨 ALERT: High email delivery failure rate', {
        provider: context.provider,
        errorCount: deliveryErrors.count,
        context,
      });
    }
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetry(error: EmailException): boolean {
    if (error instanceof EmailDeliveryException) {
      return error.retryable;
    }

    if (error instanceof EmailRateLimitException) {
      return true; // Rate limits should be retried with backoff
    }

    if (error instanceof EmailQueueException) {
      return true; // Queue errors are often transient
    }

    return false;
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff(
    retryCallback: () => Promise<void>,
    context: ErrorContext,
    maxRetries: number = 3,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Cap at 10 seconds

        if (attempt > 1) {
          this.logger.log(
            `Retrying operation (attempt ${attempt}/${maxRetries}) after ${delay}ms`,
            context,
          );
          await this.sleep(delay);
        }

        await retryCallback();

        if (attempt > 1) {
          this.logger.log(
            `Operation succeeded on retry attempt ${attempt}`,
            context,
          );
        }

        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          this.logger.error(`All retry attempts failed for operation`, {
            ...context,
            attempts: maxRetries,
            finalError: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }
    }
  }

  /**
   * Determine if error is critical
   */
  private isCriticalError(error: EmailException): boolean {
    return (
      error instanceof EmailConfigurationException ||
      error instanceof EmailQueueException ||
      (error instanceof EmailDeliveryException && !error.retryable)
    );
  }

  /**
   * Determine if error should be logged as warning
   */
  private isWarningError(error: EmailException): boolean {
    return (
      error instanceof EmailRateLimitException ||
      (error instanceof EmailDeliveryException && error.retryable)
    );
  }

  /**
   * Get recent errors within specified time window
   */
  private getRecentErrors(timeWindowMs: number): ErrorMetrics[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return Array.from(this.errorMetrics.values()).filter(
      (metric) => metric.lastOccurred >= cutoff,
    );
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
