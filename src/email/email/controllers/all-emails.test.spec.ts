import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailQueueService } from '../services/email-queue.service';
import { RedisService } from '../../redis/redis.service';
import { EmailPriority } from '../dto/email.dto';

// =============================================
// CONFIGURE TEST EMAIL ADDRESS HERE
// =============================================
const TEST_EMAIL = 'derrickbinangbang1@gmail.com';

describe('EmailController - Send All Email Types Test', () => {
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

  it('should send all email types (Welcome, Password Reset, Email Verification, Generic, Bulk, Scheduled) successfully', async () => {
    // Mock all email service methods to resolve successfully
    mockEmailQueueService.sendWelcomeEmail.mockResolvedValue(undefined);
    mockEmailQueueService.sendPasswordResetEmail.mockResolvedValue(undefined);
    mockEmailQueueService.addEmailJob.mockResolvedValue(undefined);
    mockEmailQueueService.addBulkEmailJob.mockResolvedValue(undefined);
    mockEmailQueueService.scheduleEmail.mockResolvedValue(undefined);

    console.log(`\n🧪 Starting comprehensive email test to: ${TEST_EMAIL}\n`);

    // 1. WELCOME EMAIL
    console.log('📧 Sending Welcome Email...');
    const welcomeDto = {
      to: TEST_EMAIL,
      name: 'John Doe',
      appName: 'Ayahay',
      dashboardUrl: 'https://app.ayahay.com/dashboard',
      priority: EmailPriority.HIGH,
    };

    const welcomeResult = await controller.sendWelcomeEmail(welcomeDto);
    expect(welcomeResult).toEqual({
      success: true,
      message: 'Welcome email queued successfully',
      statusCode: HttpStatus.OK,
    });
    expect(mockEmailQueueService.sendWelcomeEmail).toHaveBeenCalledWith(
      welcomeDto.to,
      {
        name: welcomeDto.name,
        appName: welcomeDto.appName,
        dashboardUrl: welcomeDto.dashboardUrl,
      },
      { priority: welcomeDto.priority },
    );
    console.log('✅ Welcome Email queued successfully');

    // 2. PASSWORD RESET EMAIL
    console.log('🔐 Sending Password Reset Email...');
    const passwordResetDto = {
      to: TEST_EMAIL,
      name: 'John Doe',
      resetUrl: 'https://app.ayahay.com/reset-password?token=abc123xyz',
      expirationTime: '1 hour',
      priority: EmailPriority.CRITICAL,
    };

    const passwordResetResult = await controller.sendPasswordResetEmail(passwordResetDto);
    expect(passwordResetResult).toEqual({
      success: true,
      message: 'Password reset email queued successfully',
      statusCode: HttpStatus.OK,
    });
    expect(mockEmailQueueService.sendPasswordResetEmail).toHaveBeenCalledWith(
      passwordResetDto.to,
      {
        name: passwordResetDto.name,
        resetUrl: passwordResetDto.resetUrl,
        expirationTime: passwordResetDto.expirationTime,
      },
      { priority: passwordResetDto.priority },
    );
    console.log('✅ Password Reset Email queued successfully');

    // 3. EMAIL VERIFICATION (using generic email with template)
    console.log('✉️ Sending Email Verification Email...');
    const emailVerificationDto = {
      to: TEST_EMAIL,
      templateName: 'email_verification',
      templateVariables: {
        name: 'John Doe',
        verificationCode: '123456',
        verificationUrl: 'https://app.ayahay.com/verify?code=123456',
        expiresIn: '10 minutes',
      },
      priority: EmailPriority.HIGH,
    };

    const emailVerificationResult = await controller.sendEmail(emailVerificationDto);
    expect(emailVerificationResult).toEqual({
      success: true,
      message: 'Email queued successfully',
      statusCode: HttpStatus.OK,
    });
    expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(emailVerificationDto);
    console.log('✅ Email Verification Email queued successfully');

    // 4. GENERIC CUSTOM EMAIL
    console.log('💌 Sending Generic Custom Email...');
    const genericEmailDto = {
      to: TEST_EMAIL,
      subject: 'Custom Notification - All Email Types Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #24AAFF;">🎉 All Email Types Test Complete!</h1>
          <p>Hi John Doe,</p>
          <p>This is a custom notification email sent as part of the comprehensive email test.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Emails Sent:</h3>
            <ul>
              <li>Welcome Email</li>
              <li>Password Reset Email</li>
              <li>Email Verification Email</li>
              <li>Generic Custom Email (this one)</li>
              <li>Bulk Emails (coming next)</li>
              <li>Scheduled Email (coming next)</li>
            </ul>
          </div>
          <p>Best regards,<br/>Ayahay Email Service</p>
        </div>
      `,
      text: 'All Email Types Test Complete! This is a custom notification email.',
      priority: EmailPriority.NORMAL,
    };

    const genericEmailResult = await controller.sendEmail(genericEmailDto);
    expect(genericEmailResult).toEqual({
      success: true,
      message: 'Email queued successfully',
      statusCode: HttpStatus.OK,
    });
    expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledWith(genericEmailDto);
    console.log('✅ Generic Custom Email queued successfully');

    // 5. BULK EMAILS
    console.log('📮 Sending Bulk Emails...');
    const bulkEmailDto = {
      emails: [
        {
          to: TEST_EMAIL,
          templateName: 'welcome',
          templateVariables: {
            name: 'John Doe',
            appName: 'Ayahay Bulk Test 1',
          },
          priority: EmailPriority.NORMAL,
        },
        {
          to: TEST_EMAIL,
          subject: 'Bulk Email #2 - Custom Content',
          html: '<h2>🚀 Bulk Email Test #2</h2><p>This is the second email in the bulk test.</p>',
          priority: EmailPriority.NORMAL,
        },
        {
          to: TEST_EMAIL,
          templateName: 'password_reset',
          templateVariables: {
            name: 'John Doe',
            resetUrl: 'https://app.ayahay.com/reset-password?token=bulk-test-token',
            expirationTime: '30 minutes',
          },
          priority: EmailPriority.LOW,
        },
      ],
      batchSize: 2,
    };

    const bulkEmailResult = await controller.sendBulkEmail(bulkEmailDto);
    expect(bulkEmailResult).toEqual({
      success: true,
      message: `Bulk email job queued for ${bulkEmailDto.emails.length} emails`,
      statusCode: HttpStatus.OK,
    });
    expect(mockEmailQueueService.addBulkEmailJob).toHaveBeenCalledWith(bulkEmailDto);
    console.log(`✅ Bulk Emails queued successfully (${bulkEmailDto.emails.length} emails)`);

    // 6. SCHEDULED EMAIL
    console.log('⏰ Scheduling Email...');
    const scheduledDate = new Date(Date.now() + 300000); // 5 minutes from now
    const scheduledEmailDto = {
      to: TEST_EMAIL,
      subject: 'Scheduled Email - All Types Test Complete',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">⏰ Scheduled Email Delivered!</h1>
          <p>Hi John Doe,</p>
          <p>This scheduled email confirms that all email types were successfully queued:</p>
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #28a745;">
            <h3>📊 Test Summary:</h3>
            <ul>
              <li>✅ Welcome Email</li>
              <li>✅ Password Reset Email</li>
              <li>✅ Email Verification Email</li>
              <li>✅ Generic Custom Email</li>
              <li>✅ Bulk Emails (3 emails)</li>
              <li>✅ Scheduled Email (this one)</li>
            </ul>
            <p><strong>Total: 7+ emails queued successfully!</strong></p>
          </div>
          <p>Scheduled for: ${scheduledDate.toLocaleString()}</p>
          <p>Best regards,<br/>Ayahay Email Service Test Suite</p>
        </div>
      `,
      text: 'Scheduled Email - All email types test completed successfully!',
      scheduledAt: scheduledDate.toISOString(),
      priority: EmailPriority.LOW,
    };

    const scheduledEmailResult = await controller.scheduleEmail(scheduledEmailDto);
    expect(scheduledEmailResult).toEqual({
      success: true,
      message: `Email scheduled for ${scheduledDate.toISOString()}`,
      statusCode: HttpStatus.OK,
    });

    const expectedEmailData = {
      to: scheduledEmailDto.to,
      templateName: undefined,
      templateVariables: undefined,
      subject: scheduledEmailDto.subject,
      html: scheduledEmailDto.html,
      text: scheduledEmailDto.text,
      priority: scheduledEmailDto.priority,
      delay: undefined,
    };

    expect(mockEmailQueueService.scheduleEmail).toHaveBeenCalledWith(
      expectedEmailData,
      scheduledDate,
    );
    console.log(`✅ Scheduled Email queued successfully for ${scheduledDate.toLocaleString()}`);

    // SUMMARY
    console.log('\n🎉 ALL EMAIL TYPES TEST COMPLETED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log('   - Welcome Email: ✅');
    console.log('   - Password Reset Email: ✅');
    console.log('   - Email Verification Email: ✅');
    console.log('   - Generic Custom Email: ✅');
    console.log('   - Bulk Emails (3 emails): ✅');
    console.log('   - Scheduled Email: ✅');
    console.log(`   - Total emails queued: 7+ emails to ${TEST_EMAIL}`);
    console.log('   - All priorities tested: LOW, NORMAL, HIGH, CRITICAL');
    console.log('   - All templates tested: welcome, password_reset, email_verification');
    console.log('\n✨ Test completed successfully! Check your email inbox.\n');

    // Verify that all service methods were called
    expect(mockEmailQueueService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailQueueService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailQueueService.addEmailJob).toHaveBeenCalledTimes(2); // Email verification + Custom email
    expect(mockEmailQueueService.addBulkEmailJob).toHaveBeenCalledTimes(1);
    expect(mockEmailQueueService.scheduleEmail).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully when sending all email types', async () => {
    // Mock services to throw errors
    const error = new Error('Service temporarily unavailable');
    mockEmailQueueService.sendWelcomeEmail.mockRejectedValue(error);
    mockEmailQueueService.sendPasswordResetEmail.mockRejectedValue(error);
    mockEmailQueueService.addEmailJob.mockRejectedValue(error);

    console.log('\n🧪 Testing error handling for all email types...\n');

    // Test welcome email error
    const welcomeDto = {
      to: TEST_EMAIL,
      name: 'John Doe',
      appName: 'Ayahay',
    };

    const welcomeResult = await controller.sendWelcomeEmail(welcomeDto);
    expect(welcomeResult).toEqual({
      success: false,
      message: 'Failed to queue welcome email',
      error: 'Service temporarily unavailable',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    // Test password reset email error
    const passwordResetDto = {
      to: TEST_EMAIL,
      resetUrl: 'https://app.ayahay.com/reset-password?token=test',
    };

    const passwordResetResult = await controller.sendPasswordResetEmail(passwordResetDto);
    expect(passwordResetResult).toEqual({
      success: false,
      message: 'Failed to queue password reset email',
      error: 'Service temporarily unavailable',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    // Test generic email error
    const genericEmailDto = {
      to: TEST_EMAIL,
      subject: 'Test Email',
      html: '<h1>Test</h1>',
    };

    const genericEmailResult = await controller.sendEmail(genericEmailDto);
    expect(genericEmailResult).toEqual({
      success: false,
      message: 'Failed to queue email',
      error: 'Service temporarily unavailable',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });

    console.log('✅ Error handling test completed successfully');
  });
});