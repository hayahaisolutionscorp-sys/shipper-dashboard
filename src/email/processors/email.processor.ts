import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AwsSesProvider } from '../providers/aws-ses/aws-ses.provider';
import {
  EmailJobData,
  BulkEmailJobData,
} from '../services/email-queue.service';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private awsSesProvider: AwsSesProvider) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-email':
        return this.handleSendEmail(job as Job<EmailJobData>);
      case 'send-bulk-email':
        return this.handleBulkEmail(job as Job<BulkEmailJobData>);
      default:
        return this.handleFailedJob(job);
    }
  }

  private async handleSendEmail(job: Job<EmailJobData>) {
    const { to, templateName, templateVariables, subject, html, text } =
      job.data;
    try {
      this.logger.log(
        `Processing email job ${job.id} for: ${Array.isArray(to) ? to.join(', ') : to}`,
      );

      if (templateName && templateVariables) {
        // Send template-based email
        if (Array.isArray(to)) {
          // Send to multiple recipients
          await Promise.all(
            to.map((recipient) =>
              this.awsSesProvider.sendTemplateEmail(
                recipient,
                templateName,
                templateVariables,
              ),
            ),
          );
        } else {
          // Send to single recipient
          await this.awsSesProvider.sendTemplateEmail(
            to,
            templateName,
            templateVariables,
          );
        }
      } else if (subject && html) {
        // Send custom email
        if (Array.isArray(to)) {
          // Send to multiple recipients
          await Promise.all(
            to.map((recipient) =>
              this.awsSesProvider.sendEmail({
                to: recipient,
                subject,
                html,
                text,
              }),
            ),
          );
        } else {
          // Send to single recipient
          await this.awsSesProvider.sendEmail({
            to,
            subject,
            html,
            text,
          });
        }
      } else {
        throw new Error('Invalid email data: missing template or subject/html');
      }

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error; // This will mark the job as failed and trigger retries
    }
  }

  private async handleBulkEmail(job: Job<BulkEmailJobData>) {
    const { emails, batchSize = 10 } = job.data;

    try {
      this.logger.log(
        `Processing bulk email job ${job.id} for ${emails.length} emails`,
      );

      // Process emails in batches to avoid overwhelming the email provider
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (emailData, index) => {
            const globalIndex = i + index;

            try {
              if (emailData.templateName && emailData.templateVariables) {
                if (Array.isArray(emailData.to)) {
                  await Promise.all(
                    emailData.to.map((recipient) =>
                      this.awsSesProvider.sendTemplateEmail(
                        recipient,
                        emailData.templateName!,
                        emailData.templateVariables!,
                      ),
                    ),
                  );
                } else {
                  await this.awsSesProvider.sendTemplateEmail(
                    emailData.to,
                    emailData.templateName,
                    emailData.templateVariables,
                  );
                }
              } else if (emailData.subject && emailData.html) {
                if (Array.isArray(emailData.to)) {
                  await Promise.all(
                    emailData.to.map((recipient) =>
                      this.awsSesProvider.sendEmail({
                        to: recipient,
                        subject: emailData.subject!,
                        html: emailData.html!,
                        text: emailData.text,
                      }),
                    ),
                  );
                } else {
                  await this.awsSesProvider.sendEmail({
                    to: emailData.to,
                    subject: emailData.subject,
                    html: emailData.html,
                    text: emailData.text,
                  });
                }
              }

              this.logger.debug(
                `Bulk email ${globalIndex + 1}/${emails.length} sent successfully`,
              );
            } catch (error) {
              this.logger.error(
                `Bulk email ${globalIndex + 1}/${emails.length} failed:`,
                error,
              );
              // Don't throw here - we want to continue with other emails
            }
          }),
        );

        // Small delay between batches to prevent rate limiting
        if (i + batchSize < emails.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      this.logger.log(`Bulk email job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Bulk email job ${job.id} failed:`, error);
      throw error;
    }
  }

  private handleFailedJob(job: Job) {
    this.logger.error(`Unknown job type: ${job.name}`, job.data);
    throw new Error(`Unknown job type: ${job.name}`);
  }
}
