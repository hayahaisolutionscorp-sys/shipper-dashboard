import {
  Controller,
  Post,
  Body,
  Get,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { EmailQueueService } from '../services/email-queue.service';
import { RedisService } from '../../../redis/redis.service';
import {
  SendEmailDto,
  WelcomeEmailDto,
  PasswordResetEmailDto,
  PasswordResetCodeEmailDto,
  BulkEmailDto,
  ScheduleEmailDto,
} from '../dto/email.dto';

@ApiTags('email')
@Controller('email')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EmailController {
  constructor(
    private emailQueueService: EmailQueueService,
    private redisService: RedisService,
  ) {}

  @Post('send')
  @ApiOperation({
    summary: 'Send a generic email',
    description: 'Queue an email for sending. Can use templates or provide custom HTML/text content.',
  })
  @ApiBody({ type: SendEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email queued successfully',
    schema: {
      example: {
        success: true,
        message: 'Email queued successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to queue email',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue email',
        error: 'Error message details',
        statusCode: 500,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Send a welcome email',
    description: 'Queue a welcome email using the welcome template. Perfect for new user onboarding.',
  })
  @ApiBody({ type: WelcomeEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Welcome email queued successfully',
    schema: {
      example: {
        success: true,
        message: 'Welcome email queued successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to queue welcome email',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue welcome email',
        error: 'Template not found',
        statusCode: 500,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Send a password reset email',
    description: 'Queue a password reset email with a secure reset link.',
  })
  @ApiBody({ type: PasswordResetEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email queued successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset email queued successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to queue password reset email',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue password reset email',
        error: 'Invalid reset URL',
        statusCode: 500,
      },
    },
  })
  async sendPasswordResetEmail(@Body() dto: PasswordResetEmailDto) {
    try {
      await this.emailQueueService.sendPasswordResetEmail(
        dto.to,
        {
          name: dto.name,
          resetUrl: dto.resetUrl,
          expirationTime: dto.expirationTime,
        },
        { priority: dto.priority }
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

  @Post('send/password-reset-code')
  @ApiOperation({ summary: 'Send a password reset email with an OTP code' })
  @ApiBody({ type: PasswordResetCodeEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset code queued successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset code queued for user@example.com',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue password reset code',
        error: 'Validation failed (email is expected)',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to queue password reset code',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue password reset code',
        error: 'Template not found',
        statusCode: 500,
      },
    },
  })
  async sendPasswordResetCode(@Body() dto: PasswordResetCodeEmailDto) {
    try {
      await this.emailQueueService.sendPasswordResetCode(
        dto.to,
        {
          name: dto.name,
          resetCode: dto.code,
          expiresIn: dto.expirationTime,
        },
        { priority: dto.priority },
      );
      return {
        success: true,
        message: `Password reset code queued for ${dto.to}`,
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to queue password reset code',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }

  @Post('send/bulk')
  @ApiOperation({
    summary: 'Send bulk emails',
    description: 'Queue multiple emails for batch processing. Ideal for newsletters, notifications, or marketing campaigns.',
  })
  @ApiBody({ type: BulkEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Bulk email job queued successfully',
    schema: {
      example: {
        success: true,
        message: 'Bulk email job queued for 150 emails',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to queue bulk email',
    schema: {
      example: {
        success: false,
        message: 'Failed to queue bulk email',
        error: 'Batch size exceeds limit',
        statusCode: 500,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Schedule an email for future delivery',
    description: 'Schedule an email to be sent at a specific date and time.',
  })
  @ApiBody({ type: ScheduleEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email scheduled successfully',
    schema: {
      example: {
        success: true,
        message: 'Email scheduled for 2025-12-31T23:59:59.000Z',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to schedule email',
    schema: {
      example: {
        success: false,
        message: 'Failed to schedule email',
        error: 'Invalid date format',
        statusCode: 500,
      },
    },
  })
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
  @ApiTags('queue')
  @ApiOperation({
    summary: 'Get email queue status',
    description: 'Retrieve current status of the email queue including counts of waiting, active, completed, and failed jobs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          waiting: 42,
          active: 3,
          completed: 1250,
          failed: 5,
          delayed: 10,
          paused: false,
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to get queue status',
    schema: {
      example: {
        success: false,
        message: 'Failed to get queue status',
        error: 'Redis connection error',
        statusCode: 500,
      },
    },
  })
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
  @ApiTags('queue')
  @ApiOperation({
    summary: 'Pause the email queue',
    description: 'Temporarily pause email processing. Jobs will remain in the queue but won\'t be processed until resumed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue paused successfully',
    schema: {
      example: {
        success: true,
        message: 'Queue paused successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to pause queue',
    schema: {
      example: {
        success: false,
        message: 'Failed to pause queue',
        error: 'Queue already paused',
        statusCode: 500,
      },
    },
  })
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
  @ApiTags('queue')
  @ApiOperation({
    summary: 'Resume the email queue',
    description: 'Resume processing emails after the queue has been paused.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue resumed successfully',
    schema: {
      example: {
        success: true,
        message: 'Queue resumed successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to resume queue',
    schema: {
      example: {
        success: false,
        message: 'Failed to resume queue',
        error: 'Queue is not paused',
        statusCode: 500,
      },
    },
  })
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
  @ApiTags('queue')
  @ApiOperation({
    summary: 'Clean completed jobs from the queue',
    description: 'Remove completed and failed jobs from the queue to free up Redis memory.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue cleaned successfully',
    schema: {
      example: {
        success: true,
        message: 'Queue cleaned successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to clean queue',
    schema: {
      example: {
        success: false,
        message: 'Failed to clean queue',
        error: 'Cleanup operation failed',
        statusCode: 500,
      },
    },
  })
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
  @ApiTags('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check the health status of the email service, including Redis connection and queue status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        success: true,
        data: {
          redis: {
            status: 'healthy',
            latency: 5,
          },
          queue: {
            waiting: 10,
            active: 2,
            completed: 500,
            failed: 1,
            paused: false,
          },
          timestamp: '2025-10-03T15:30:00.000Z',
        },
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
    schema: {
      example: {
        success: false,
        message: 'Health check failed',
        error: 'Redis connection timeout',
        statusCode: 503,
      },
    },
  })
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