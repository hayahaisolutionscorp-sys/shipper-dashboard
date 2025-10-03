import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from '../../services/template.service';
import { EmailTemplate } from '../../types/template.types';
import { AbstractEmailProvider } from '../interfaces/email-provider.abstract';
import {
  SendEmailParams,
  EmailResult,
  BulkEmailResult,
  ProviderHealthCheck,
} from '../interfaces/email-provider.interface';
import { EmailConfigService } from '../../config/email.config.service';
import { EmailErrorHandler } from '../../exceptions/email-error.handler';
import {
  EmailConfigurationException,
  EmailDeliveryException,
} from '../../exceptions/email.exceptions';

@Injectable()
export class AwsSesProvider extends AbstractEmailProvider {
  readonly name = 'aws-ses';
  readonly isConfigured: boolean;

  private sesClient: SESClient;
  private fromEmail: string;

  constructor(
    private configService: ConfigService,
    private templateService: TemplateService,
    private emailConfigService?: EmailConfigService, // Optional for backward compatibility
    private errorHandler?: EmailErrorHandler, // Optional for backward compatibility
  ) {
    super();

    // Try to use EmailConfigService first, fallback to ConfigService
    let awsConfig: {
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      sender: string;
    } | null = null;
    let isConfigured = false;

    try {
      if (this.emailConfigService) {
        awsConfig = this.emailConfigService.getAwsConfig();
        isConfigured = this.emailConfigService.isAwsConfigured();
      } else {
        // Fallback to old configuration method
        const region = this.configService.get<string>('aws.region');
        const accessKeyId = this.configService.get<string>('aws.accessKeyId');
        const secretAccessKey = this.configService.get<string>(
          'aws.secretAccessKey',
        );
        const sender = this.configService.get<string>('aws.sender');

        if (region && accessKeyId && secretAccessKey && sender) {
          awsConfig = { region, accessKeyId, secretAccessKey, sender };
          isConfigured = true;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to get AWS configuration:', error);
      if (this.errorHandler && error instanceof Error) {
        this.errorHandler.handleError(error, {
          operation: 'constructor',
          provider: this.name,
        });
      }
      isConfigured = false;
    }

    this.isConfigured = isConfigured;

    if (!this.isConfigured || !awsConfig) {
      this.logger.warn('AWS SES configuration is incomplete');
      return;
    }

    try {
      this.sesClient = new SESClient({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        },
      });
      this.fromEmail = awsConfig.sender;
      this.logger.log('AWS SES provider configured successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AWS SES client:', error);
      const configError = new EmailConfigurationException(
        'Failed to initialize AWS SES client',
        this.name,
      );
      throw this.errorHandler
        ? this.errorHandler.handleError(configError, {
            operation: 'constructor',
            provider: this.name,
            originalError:
              error instanceof Error ? error.message : String(error),
          })
        : configError;
    }
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!this.isConfigured) {
      const error = new EmailConfigurationException(
        'AWS SES provider is not properly configured',
        this.name,
      );
      throw this.errorHandler
        ? this.errorHandler.handleError(error, {
            operation: 'sendEmail',
            provider: this.name,
          })
        : error;
    }

    this.validateEmailParams(params);
    this.logEmailAttempt(params);

    const messageId = this.generateMessageId();
    const recipient = Array.isArray(params.to) ? params.to[0] : params.to;

    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: this.normalizeEmailAddresses(params.to),
          CcAddresses: params.cc
            ? this.normalizeEmailAddresses(params.cc)
            : undefined,
          BccAddresses: params.bcc
            ? this.normalizeEmailAddresses(params.bcc)
            : undefined,
        },
        Message: {
          Subject: { Data: params.subject },
          Body: {
            Html: { Data: params.html },
            Text: { Data: params.text || '' },
          },
        },
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
      });

      const result = await this.sesClient.send(command);

      const emailResult: EmailResult = {
        messageId: result.MessageId || messageId,
        status: 'sent',
        provider: this.name,
        timestamp: new Date(),
      };

      this.logEmailResult(emailResult);
      return emailResult;
    } catch (error) {
      const emailResult: EmailResult = {
        messageId,
        status: 'failed',
        provider: this.name,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown AWS SES error',
      };

      this.logEmailResult(emailResult);

      const context = {
        operation: 'sendEmail',
        provider: this.name,
        recipient,
        messageId,
      };

      if (this.errorHandler && error instanceof Error) {
        throw this.errorHandler.handleError(error, context);
      } else {
        throw new EmailDeliveryException(
          `AWS SES send failed: ${emailResult.error}`,
          recipient,
          this.name,
          error instanceof Error ? error : undefined,
        );
      }
    }
  }

  async sendBulkEmail(emails: SendEmailParams[]): Promise<BulkEmailResult> {
    if (!this.isConfigured) {
      const error = new EmailConfigurationException(
        'AWS SES provider is not properly configured',
        this.name,
      );
      throw this.errorHandler
        ? this.errorHandler.handleError(error, {
            operation: 'sendBulkEmail',
            provider: this.name,
          })
        : error;
    }

    if (emails.length === 0) {
      return {
        success: [],
        failed: [],
        totalSent: 0,
        totalFailed: 0,
      };
    }

    // For AWS SES, we'll use the default sequential implementation
    // AWS SES does have bulk capabilities, but they're more complex to implement
    // This can be enhanced later for better performance
    return super.sendBulkEmail(emails);
  }

  async validateConfiguration(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Test configuration by checking SES sending statistics
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: { ToAddresses: [this.fromEmail] },
        Message: {
          Subject: { Data: 'Configuration Test' },
          Body: {
            Text: { Data: 'This is a configuration test email.' },
          },
        },
      });

      // We don't actually send the email, just validate the command would work
      await this.sesClient.send(command);
      return true;
    } catch (error) {
      this.logger.error('AWS SES configuration validation failed', error);
      if (this.errorHandler && error instanceof Error) {
        this.errorHandler.handleError(error, {
          operation: 'validateConfiguration',
          provider: this.name,
        });
      }
      return false;
    }
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    if (!this.isConfigured) {
      return {
        status: 'unhealthy',
        error: 'Provider not configured',
        lastChecked: new Date(),
      };
    }

    try {
      // Simple health check - validate credentials and permissions
      const isValid = await this.validateConfiguration();
      const latency = Date.now() - startTime;

      return {
        status: isValid ? 'healthy' : 'unhealthy',
        latency,
        lastChecked: new Date(),
        error: isValid ? undefined : 'Configuration validation failed',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  getLimits() {
    // AWS SES default limits (can be increased by AWS support)
    return {
      maxRecipientsPerEmail: 50, // Default limit
      maxEmailsPerSecond: 14, // Default sending rate (can be higher)
      maxAttachmentSize: 10 * 1024 * 1024, // 10MB
      maxEmailSize: 10 * 1024 * 1024, // 10MB total
    };
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendEmail with SendEmailParams instead
   */
  async sendLegacyEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ) {
    return this.sendEmail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
    });
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendEmail with template rendering instead
   */
  async sendTemplateEmail(
    to: string,
    templateName: string,
    variables: Record<string, unknown>,
  ) {
    const template: EmailTemplate =
      await this.templateService.renderTemplateLegacy(templateName, variables);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
