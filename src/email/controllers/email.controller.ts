import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EmailQueueService } from '../services/email-queue.service';
import { RedisService } from '../../redis/redis.service';
import {
  SendEmailDto,
  WelcomeEmailDto,
  PasswordResetEmailDto,
  BulkEmailDto,
  ScheduleEmailDto,
} from '../dto/email.dto';

@Controller('email')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EmailController {
  constructor(
    private emailQueueService: EmailQueueService,
    private redisService: RedisService,
  ) {}

  @Post('send')
  async sendEmail(@Body() dto: SendEmailDto) {
    try {
      await this.emailQueueService.addEmailJob(dto);
      return {
        success: true,
        message: 'Email queued successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to queue email',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('send/welcome')
  async sendWelcomeEmail(@Body() dto: WelcomeEmailDto) {
    try {
      await this.emailQueueService.sendWelcomeEmail(
        dto.to,
        {
          name: dto.name,
          appName: dto.appName,
          dashboardUrl: dto.dashboardUrl,
        },
        { priority: dto.priority },
      );
      return {
        success: true,
        message: 'Welcome email queued successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to queue welcome email',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('send/password-reset')
  async sendPasswordResetEmail(@Body() dto: PasswordResetEmailDto) {
    try {
      await this.emailQueueService.sendPasswordResetEmail(
        dto.to,
        {
          name: dto.name,
          resetUrl: dto.resetUrl,
          expirationTime: dto.expirationTime,
        },
        { priority: dto.priority },
      );
      return {
        success: true,
        message: 'Password reset email queued successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to queue password reset email',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('send/bulk')
  async sendBulkEmail(@Body() dto: BulkEmailDto) {
    try {
      await this.emailQueueService.addBulkEmailJob(dto);
      return {
        success: true,
        message: `Bulk email job queued for ${dto.emails.length} emails`,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to queue bulk email',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('schedule')
  async scheduleEmail(@Body() dto: ScheduleEmailDto) {
    try {
      const scheduledDate = new Date(dto.scheduledAt);
      const emailData = {
        to: dto.to,
        templateName: dto.templateName,
        templateVariables: dto.templateVariables,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
        priority: dto.priority,
        delay: dto.delay,
      };

      await this.emailQueueService.scheduleEmail(emailData, scheduledDate);
      return {
        success: true,
        message: `Email scheduled for ${scheduledDate.toISOString()}`,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to schedule email',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Get('queue/status')
  async getQueueStatus() {
    try {
      const status = await this.emailQueueService.getQueueStatus();
      return {
        success: true,
        data: status,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get queue status',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('queue/pause')
  async pauseQueue() {
    try {
      await this.emailQueueService.pauseQueue();
      return {
        success: true,
        message: 'Queue paused successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to pause queue',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('queue/resume')
  async resumeQueue() {
    try {
      await this.emailQueueService.resumeQueue();
      return {
        success: true,
        message: 'Queue resumed successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resume queue',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('queue/clean')
  async cleanQueue() {
    try {
      await this.emailQueueService.cleanQueue();
      return {
        success: true,
        message: 'Queue cleaned successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clean queue',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      const redisHealth = await this.redisService.healthCheck();
      const queueStatus = await this.emailQueueService.getQueueStatus();

      return {
        success: true,
        data: {
          redis: redisHealth,
          queue: queueStatus,
          timestamp: new Date().toISOString(),
        },
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      };
    }
  }
}
