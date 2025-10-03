import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailQueueService } from '../services/email-queue.service';
import { RedisService } from '../../redis/redis.service';
import { EmailPriority } from '../dto/email.dto';

// =============================================
// CONFIGURE TEST EMAIL ADDRESSES HERE
// =============================================
const TEST_EMAILS = {
  PRIMARY: 'derrickbinangbang1@gmail.com',
  SECONDARY: 'derrickbinangbang1@gmail.com',
  BULK_RECIPIENTS: ['derrickbinangbang1@gmail.com'],
};

describe('EmailController', () => {
  let controller: EmailController;

  const mockEmailQueueService = {
    addEmailJob: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    addBulkEmailJob: jest.fn(),
    scheduleEmail: jest.fn(),
    getQueueStatus: jest.fn(),
    pauseQueue: jest.fn(),
    resumeQueue: jest.fn(),
    cleanQueue: jest.fn(),
  };

  const mockRedisService = {
    healthCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /email/send', () => {
    it('should queue a basic email successfully', async () => {
      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        subject: 'Test Email',
        html: '<h1>Hello World</h1>',
        text: 'Hello World',
        priority: EmailPriority.NORMAL,
      };

      const result = await controller.sendEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should queue a template-based email successfully', async () => {
      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.SECONDARY,
        templateName: 'welcome',
        templateVariables: { name: 'John Doe', appName: 'Ayahay' },
        priority: EmailPriority.HIGH,
      };

      const result = await controller.sendEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should handle multiple recipients', async () => {
      mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);

      const dto = {
        to: [TEST_EMAILS.PRIMARY, TEST_EMAILS.SECONDARY],
        subject: 'Multiple Recipients Test',
        html: '<p>Testing multiple recipients</p>',
        priority: EmailPriority.NORMAL,
      };

      const result = await controller.sendEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Queue service error');
      mockEmailQueueService.addEmailJob.mockRejectedValue(error);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        subject: 'Test Email',
        html: '<h1>Hello World</h1>',
      };

      const result = await controller.sendEmail(dto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to queue email',
        error: 'Queue service error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/send/welcome', () => {
    it('should queue welcome email successfully', async () => {
      mockEmailQueueService.sendWelcomeEmail.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        name: 'John Doe',
        appName: 'Ayahay',
        dashboardUrl: 'https://app.ayahay.com/dashboard',
        priority: EmailPriority.HIGH,
      };

      const result = await controller.sendWelcomeEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Welcome email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.sendWelcomeEmail).toHaveBeenCalledWith(
        dto.to,
        {
          name: dto.name,
          appName: dto.appName,
          dashboardUrl: dto.dashboardUrl,
        },
        { priority: dto.priority },
      );
    });

    it('should handle welcome email without dashboard URL', async () => {
      mockEmailQueueService.sendWelcomeEmail.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.SECONDARY,
        name: 'Jane Smith',
        appName: 'Ayahay',
      };

      const result = await controller.sendWelcomeEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Welcome email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.sendWelcomeEmail).toHaveBeenCalledWith(
        dto.to,
        {
          name: dto.name,
          appName: dto.appName,
          dashboardUrl: undefined,
        },
        { priority: undefined },
      );
    });

    it('should handle welcome email errors', async () => {
      const error = new Error('Welcome email service error');
      mockEmailQueueService.sendWelcomeEmail.mockRejectedValue(error);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        name: 'John Doe',
        appName: 'Ayahay',
      };

      const result = await controller.sendWelcomeEmail(dto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to queue welcome email',
        error: 'Welcome email service error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/send/password-reset', () => {
    it('should queue password reset email successfully', async () => {
      mockEmailQueueService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        name: 'John Doe',
        resetUrl: 'https://app.ayahay.com/reset-password?token=abc123',
        expirationTime: '1 hour',
        priority: EmailPriority.CRITICAL,
      };

      const result = await controller.sendPasswordResetEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Password reset email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.sendPasswordResetEmail).toHaveBeenCalledWith(
        dto.to,
        {
          name: dto.name,
          resetUrl: dto.resetUrl,
          expirationTime: dto.expirationTime,
        },
        { priority: dto.priority },
      );
    });

    it('should handle password reset email without optional fields', async () => {
      mockEmailQueueService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const dto = {
        to: TEST_EMAILS.SECONDARY,
        resetUrl: 'https://app.ayahay.com/reset-password?token=xyz789',
      };

      const result = await controller.sendPasswordResetEmail(dto);

      expect(result).toEqual({
        success: true,
        message: 'Password reset email queued successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.sendPasswordResetEmail).toHaveBeenCalledWith(
        dto.to,
        {
          name: undefined,
          resetUrl: dto.resetUrl,
          expirationTime: undefined,
        },
        { priority: undefined },
      );
    });

    it('should handle password reset email errors', async () => {
      const error = new Error('Password reset service error');
      mockEmailQueueService.sendPasswordResetEmail.mockRejectedValue(error);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        resetUrl: 'https://app.ayahay.com/reset-password?token=abc123',
      };

      const result = await controller.sendPasswordResetEmail(dto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to queue password reset email',
        error: 'Password reset service error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/send/bulk', () => {
    it('should queue bulk emails successfully', async () => {
      mockEmailQueueService.addBulkEmailJob.mockResolvedValue(undefined);

      const dto = {
        emails: TEST_EMAILS.BULK_RECIPIENTS.map((email, index) => ({
          to: email,
          subject: `Bulk Email ${index + 1}`,
          html: `<h1>Hello User ${index + 1}</h1>`,
          priority: EmailPriority.NORMAL,
        })),
        batchSize: 5,
      };

      const result = await controller.sendBulkEmail(dto);

      expect(result).toEqual({
        success: true,
        message: `Bulk email job queued for ${dto.emails.length} emails`,
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.addBulkEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should handle bulk template emails', async () => {
      mockEmailQueueService.addBulkEmailJob.mockResolvedValue(undefined);

      const dto = {
        emails: TEST_EMAILS.BULK_RECIPIENTS.slice(0, 5).map((email, index) => ({
          to: email,
          templateName: 'welcome',
          templateVariables: {
            name: `User ${index + 1}`,
            appName: 'Ayahay',
          },
          priority: EmailPriority.NORMAL,
        })),
        batchSize: 3,
      };

      const result = await controller.sendBulkEmail(dto);

      expect(result).toEqual({
        success: true,
        message: `Bulk email job queued for ${dto.emails.length} emails`,
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.addBulkEmailJob).toHaveBeenCalledWith(dto);
    });

    it('should handle bulk email errors', async () => {
      const error = new Error('Bulk email service error');
      mockEmailQueueService.addBulkEmailJob.mockRejectedValue(error);

      const dto = {
        emails: [
          {
            to: TEST_EMAILS.PRIMARY,
            subject: 'Bulk Test',
            html: '<p>Test</p>',
          },
        ],
      };

      const result = await controller.sendBulkEmail(dto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to queue bulk email',
        error: 'Bulk email service error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/schedule', () => {
    it('should schedule email successfully', async () => {
      mockEmailQueueService.scheduleEmail.mockResolvedValue(undefined);

      const scheduledDate = new Date(Date.now() + 3600000); // 1 hour from now
      const dto = {
        to: TEST_EMAILS.PRIMARY,
        subject: 'Scheduled Email',
        html: '<h1>This is a scheduled email</h1>',
        scheduledAt: scheduledDate.toISOString(),
        priority: EmailPriority.NORMAL,
      };

      const result = await controller.scheduleEmail(dto);

      expect(result).toEqual({
        success: true,
        message: `Email scheduled for ${scheduledDate.toISOString()}`,
        statusCode: HttpStatus.OK,
      });

      const expectedEmailData = {
        to: dto.to,
        templateName: undefined,
        templateVariables: undefined,
        subject: dto.subject,
        html: dto.html,
        text: undefined,
        priority: dto.priority,
        delay: undefined,
      };

      expect(mockEmailQueueService.scheduleEmail).toHaveBeenCalledWith(
        expectedEmailData,
        scheduledDate,
      );
    });

    it('should schedule template email successfully', async () => {
      mockEmailQueueService.scheduleEmail.mockResolvedValue(undefined);

      const scheduledDate = new Date(Date.now() + 7200000); // 2 hours from now
      const dto = {
        to: TEST_EMAILS.SECONDARY,
        templateName: 'welcome',
        templateVariables: { name: 'Jane Doe', appName: 'Ayahay' },
        scheduledAt: scheduledDate.toISOString(),
        priority: EmailPriority.HIGH,
      };

      const result = await controller.scheduleEmail(dto);

      expect(result).toEqual({
        success: true,
        message: `Email scheduled for ${scheduledDate.toISOString()}`,
        statusCode: HttpStatus.OK,
      });

      const expectedEmailData = {
        to: dto.to,
        templateName: dto.templateName,
        templateVariables: dto.templateVariables,
        subject: undefined,
        html: undefined,
        text: undefined,
        priority: dto.priority,
        delay: undefined,
      };

      expect(mockEmailQueueService.scheduleEmail).toHaveBeenCalledWith(
        expectedEmailData,
        scheduledDate,
      );
    });

    it('should handle schedule email errors', async () => {
      const error = new Error('Schedule service error');
      mockEmailQueueService.scheduleEmail.mockRejectedValue(error);

      const dto = {
        to: TEST_EMAILS.PRIMARY,
        subject: 'Scheduled Email',
        html: '<h1>Test</h1>',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      };

      const result = await controller.scheduleEmail(dto);

      expect(result).toEqual({
        success: false,
        message: 'Failed to schedule email',
        error: 'Schedule service error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('GET /email/queue/status', () => {
    it('should get queue status successfully', async () => {
      const mockStatus = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      };

      mockEmailQueueService.getQueueStatus.mockResolvedValue(mockStatus);

      const result = await controller.getQueueStatus();

      expect(result).toEqual({
        success: true,
        data: mockStatus,
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.getQueueStatus).toHaveBeenCalled();
    });

    it('should handle queue status errors', async () => {
      const error = new Error('Queue status error');
      mockEmailQueueService.getQueueStatus.mockRejectedValue(error);

      const result = await controller.getQueueStatus();

      expect(result).toEqual({
        success: false,
        message: 'Failed to get queue status',
        error: 'Queue status error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/queue/pause', () => {
    it('should pause queue successfully', async () => {
      mockEmailQueueService.pauseQueue.mockResolvedValue(undefined);

      const result = await controller.pauseQueue();

      expect(result).toEqual({
        success: true,
        message: 'Queue paused successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.pauseQueue).toHaveBeenCalled();
    });

    it('should handle pause queue errors', async () => {
      const error = new Error('Pause queue error');
      mockEmailQueueService.pauseQueue.mockRejectedValue(error);

      const result = await controller.pauseQueue();

      expect(result).toEqual({
        success: false,
        message: 'Failed to pause queue',
        error: 'Pause queue error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/queue/resume', () => {
    it('should resume queue successfully', async () => {
      mockEmailQueueService.resumeQueue.mockResolvedValue(undefined);

      const result = await controller.resumeQueue();

      expect(result).toEqual({
        success: true,
        message: 'Queue resumed successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.resumeQueue).toHaveBeenCalled();
    });

    it('should handle resume queue errors', async () => {
      const error = new Error('Resume queue error');
      mockEmailQueueService.resumeQueue.mockRejectedValue(error);

      const result = await controller.resumeQueue();

      expect(result).toEqual({
        success: false,
        message: 'Failed to resume queue',
        error: 'Resume queue error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('POST /email/queue/clean', () => {
    it('should clean queue successfully', async () => {
      mockEmailQueueService.cleanQueue.mockResolvedValue(undefined);

      const result = await controller.cleanQueue();

      expect(result).toEqual({
        success: true,
        message: 'Queue cleaned successfully',
        statusCode: HttpStatus.OK,
      });
      expect(mockEmailQueueService.cleanQueue).toHaveBeenCalled();
    });

    it('should handle clean queue errors', async () => {
      const error = new Error('Clean queue error');
      mockEmailQueueService.cleanQueue.mockRejectedValue(error);

      const result = await controller.cleanQueue();

      expect(result).toEqual({
        success: false,
        message: 'Failed to clean queue',
        error: 'Clean queue error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('GET /email/health', () => {
    it('should return healthy status', async () => {
      const mockRedisHealth = { status: 'healthy', latency: 5 };
      const mockQueueStatus = {
        waiting: 0,
        active: 1,
        completed: 50,
        failed: 0,
        delayed: 0,
      };

      mockRedisService.healthCheck.mockResolvedValue(mockRedisHealth);
      mockEmailQueueService.getQueueStatus.mockResolvedValue(mockQueueStatus);

      const result = await controller.healthCheck();

      expect(result).toEqual({
        success: true,
        data: {
          redis: mockRedisHealth,
          queue: mockQueueStatus,
          timestamp: expect.any(String) as string,
        },
        statusCode: HttpStatus.OK,
      });
      expect(mockRedisService.healthCheck).toHaveBeenCalled();
      expect(mockEmailQueueService.getQueueStatus).toHaveBeenCalled();
    });

    it('should handle health check errors', async () => {
      const error = new Error('Health check error');
      mockRedisService.healthCheck.mockRejectedValue(error);

      const result = await controller.healthCheck();

      expect(result).toEqual({
        success: false,
        message: 'Health check failed',
        error: 'Health check error',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('should handle unhealthy Redis status', async () => {
      const mockRedisHealth = { status: 'unhealthy' };
      const mockQueueStatus = {
        waiting: 10,
        active: 0,
        completed: 25,
        failed: 5,
        delayed: 2,
      };

      mockRedisService.healthCheck.mockResolvedValue(mockRedisHealth);
      mockEmailQueueService.getQueueStatus.mockResolvedValue(mockQueueStatus);

      const result = await controller.healthCheck();

      expect(result).toEqual({
        success: true,
        data: {
          redis: mockRedisHealth,
          queue: mockQueueStatus,
          timestamp: expect.any(String) as string,
        },
        statusCode: HttpStatus.OK,
      });
    });
  });
});
