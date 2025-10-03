import { Injectable, Logger } from '@nestjs/common';
import {
  EmailProvider,
  SendEmailParams,
  EmailResult,
  BulkEmailResult,
  ProviderHealthCheck,
} from './email-provider.interface';

@Injectable()
export abstract class AbstractEmailProvider implements EmailProvider {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly name: string;
  abstract readonly isConfigured: boolean;

  /**
   * Abstract method that concrete providers must implement
   */
  abstract sendEmail(params: SendEmailParams): Promise<EmailResult>;

  /**
   * Abstract method for provider configuration validation
   */
  abstract validateConfiguration(): Promise<boolean>;

  /**
   * Abstract method for provider health check
   */
  abstract healthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Abstract method for provider limits
   */
  abstract getLimits(): {
    maxRecipientsPerEmail: number;
    maxEmailsPerSecond: number;
    maxAttachmentSize: number;
    maxEmailSize: number;
  };

  /**
   * Default bulk email implementation that can be overridden by providers
   * that have native bulk email support
   */
  async sendBulkEmail(emails: SendEmailParams[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    const success: EmailResult[] = [];
    const failed: EmailResult[] = [];

    this.logger.log(`Sending ${emails.length} emails in bulk`);

    // Send emails sequentially with rate limiting
    for (const emailParams of emails) {
      try {
        const result = await this.sendEmail(emailParams);
        results.push(result);

        if (result.status === 'sent') {
          success.push(result);
        } else {
          failed.push(result);
        }

        // Basic rate limiting - wait between emails
        if (emails.indexOf(emailParams) < emails.length - 1) {
          await this.rateLimitDelay();
        }
      } catch (error) {
        const failedResult: EmailResult = {
          messageId: `failed-${Date.now()}`,
          status: 'failed',
          provider: this.name,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(failedResult);
        failed.push(failedResult);
      }
    }

    this.logger.log(
      `Bulk email completed: ${success.length} sent, ${failed.length} failed`,
    );

    return {
      success,
      failed,
      totalSent: success.length,
      totalFailed: failed.length,
    };
  }

  /**
   * Normalize email addresses to always return an array
   */
  protected normalizeEmailAddresses(addresses: string | string[]): string[] {
    return Array.isArray(addresses) ? addresses : [addresses];
  }

  /**
   * Validate email address format
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate all email addresses in the params
   */
  protected validateEmailParams(params: SendEmailParams): void {
    const allEmails = [
      ...this.normalizeEmailAddresses(params.to),
      ...(params.cc ? this.normalizeEmailAddresses(params.cc) : []),
      ...(params.bcc ? this.normalizeEmailAddresses(params.bcc) : []),
    ];

    if (params.replyTo) {
      allEmails.push(params.replyTo);
    }

    const invalidEmails = allEmails.filter(
      (email) => !this.isValidEmail(email),
    );

    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
    }

    if (allEmails.length === 0) {
      throw new Error('At least one recipient is required');
    }

    const limits = this.getLimits();
    if (allEmails.length > limits.maxRecipientsPerEmail) {
      throw new Error(
        `Too many recipients. Maximum allowed: ${limits.maxRecipientsPerEmail}`,
      );
    }
  }

  /**
   * Rate limiting delay between bulk emails
   */
  private async rateLimitDelay(): Promise<void> {
    const limits = this.getLimits();
    const delayMs = Math.ceil(1000 / limits.maxEmailsPerSecond);

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  /**
   * Generate a unique message ID
   */
  protected generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${this.name}-${timestamp}-${random}`;
  }

  /**
   * Log email sending attempt
   */
  protected logEmailAttempt(params: SendEmailParams): void {
    const recipients = this.normalizeEmailAddresses(params.to);
    this.logger.log(
      `Sending email to ${recipients.length} recipient(s): ${recipients.join(', ')}`,
    );
  }

  /**
   * Log email result
   */
  protected logEmailResult(result: EmailResult): void {
    if (result.status === 'sent') {
      this.logger.log(`Email sent successfully: ${result.messageId}`);
    } else {
      this.logger.error(`Email failed: ${result.messageId} - ${result.error}`);
    }
  }
}
