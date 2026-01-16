import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';

export interface EmailJobData {
  to: string | string[];
  templateName?: string;
  templateVariables?: Record<string, any>;
  subject?: string;
  html?: string;
  text?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  delay?: number;
  scheduledAt?: Date;
}

export interface BulkEmailJobData {
  emails: EmailJobData[];
  batchSize?: number;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async addEmailJob(
    jobData: EmailJobData,
    options?: JobsOptions,
  ): Promise<void> {
    try {
      const jobOptions: JobsOptions = {
        priority: this.getPriorityValue(jobData.priority || 'normal'),
        delay: jobData.delay || 0,
        ...(jobData.scheduledAt && {
          delay: Math.max(0, jobData.scheduledAt.getTime() - Date.now()),
        }),
        ...options,
      };

      await this.emailQueue.add('send-email', jobData, jobOptions);
      this.logger.log(
        `Email job queued for: ${Array.isArray(jobData.to) ? jobData.to.join(', ') : jobData.to}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue email job:', error);
      throw error;
    }
  }

  async addBulkEmailJob(
    bulkData: BulkEmailJobData,
    options?: JobsOptions,
  ): Promise<void> {
    try {
      const jobOptions: JobsOptions = {
        priority: 5, // Normal priority for bulk emails
        ...options,
      };

      await this.emailQueue.add('send-bulk-email', bulkData, jobOptions);
      this.logger.log(
        `Bulk email job queued for ${bulkData.emails.length} emails`,
      );
    } catch (error) {
      this.logger.error('Failed to queue bulk email job:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(
    to: string,
    variables: { name: string; appName: string; dashboardUrl?: string },
    options?: { priority?: EmailJobData['priority']; delay?: number },
  ): Promise<void> {
    return this.addEmailJob({
      to,
      templateName: 'welcome',
      templateVariables: variables,
      priority: options?.priority || 'high',
      delay: options?.delay,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    variables: { name?: string; resetUrl: string; expirationTime?: string },
    options?: { priority?: EmailJobData['priority']; delay?: number },
  ): Promise<void> {
    return this.addEmailJob({
      to,
      templateName: 'password_reset',
      templateVariables: variables,
      priority: options?.priority || 'high',
      delay: options?.delay,
    });
  }

  async sendPasswordResetCode(
    to: string,
    variables: { name?: string; resetCode: string; expiresIn?: string },
    options?: { priority?: EmailJobData['priority']; delay?: number },
  ): Promise<void> {
    return this.addEmailJob({
      to,
      templateName: 'password_reset_code',
      templateVariables: variables,
      priority: options?.priority || 'high',
      delay: options?.delay,
    });
  }

  async scheduleEmail(
    jobData: EmailJobData,
    scheduledAt: Date,
    options?: JobsOptions,
  ): Promise<void> {
    return this.addEmailJob({ ...jobData, scheduledAt }, options);
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
      this.emailQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.emailQueue.pause();
    this.logger.log('Email queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.emailQueue.resume();
    this.logger.log('Email queue resumed');
  }

  async cleanQueue(): Promise<void> {
    await this.emailQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24 hours
    this.logger.log('Email queue cleaned');
  }

  private getPriorityValue(priority: EmailJobData['priority']): number {
    const priorityMap = {
      critical: 10,
      high: 8,
      normal: 5,
      low: 1,
    };
    return priorityMap[priority || 'normal'];
  }
}
