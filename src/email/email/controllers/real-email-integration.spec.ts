import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailModule } from '../email.module';
import { ConfigModule } from '@nestjs/config';
import { EmailPriority } from '../dto/email.dto';
import { BullModule } from '@nestjs/bullmq';

// =============================================
// CONFIGURE TEST EMAIL ADDRESS HERE
// =============================================
const TEST_EMAIL = 'derrickbinangbang1@gmail.com';

describe('EmailController - REAL EMAIL INTEGRATION TEST', () => {
  let app: TestingModule;
  let controller: EmailController;

  beforeAll(async () => {
    // Create a real testing module with all dependencies
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.local', '.env'],
        }),
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || 'redis123',
          },
        }),
        EmailModule,
      ],
    }).compile();

    controller = app.get<EmailController>(EmailController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('🚀 SHOULD ACTUALLY SEND ALL EMAIL TYPES TO REAL EMAIL ADDRESS', async () => {
    console.log('\n🚨 REAL EMAIL INTEGRATION TEST STARTING...');
    console.log(`📧 Target Email: ${TEST_EMAIL}`);
    console.log('⚠️  This will send REAL emails - make sure AWS SES is configured!');
    console.log('\n');

    // Wait a bit to allow Redis connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // 1. WELCOME EMAIL
      console.log('📧 Sending REAL Welcome Email...');
      const welcomeDto = {
        to: TEST_EMAIL,
        name: 'John Doe',
        appName: 'Ayahay Email Service',
        dashboardUrl: 'https://app.ayahay.com/dashboard',
        priority: EmailPriority.HIGH,
      };

      const welcomeResult = await controller.sendWelcomeEmail(welcomeDto);
      expect(welcomeResult.success).toBe(true);
      console.log('✅ Welcome Email sent successfully!');
      
      // Wait between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. PASSWORD RESET EMAIL
      console.log('🔐 Sending REAL Password Reset Email...');
      const passwordResetDto = {
        to: TEST_EMAIL,
        name: 'John Doe',
        resetUrl: 'https://app.ayahay.com/reset-password?token=real-test-token-123',
        expirationTime: '1 hour',
        priority: EmailPriority.CRITICAL,
      };

      const passwordResetResult = await controller.sendPasswordResetEmail(passwordResetDto);
      expect(passwordResetResult.success).toBe(true);
      console.log('✅ Password Reset Email sent successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. EMAIL VERIFICATION
      console.log('✉️ Sending REAL Email Verification Email...');
      const emailVerificationDto = {
        to: TEST_EMAIL,
        templateName: 'email_verification',
        templateVariables: {
          name: 'John Doe',
          verificationCode: '987654',
          verificationUrl: 'https://app.ayahay.com/verify?code=987654',
          expiresIn: '10 minutes',
        },
        priority: EmailPriority.HIGH,
      };

      const emailVerificationResult = await controller.sendEmail(emailVerificationDto);
      expect(emailVerificationResult.success).toBe(true);
      console.log('✅ Email Verification Email sent successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. CUSTOM HTML EMAIL
      console.log('💌 Sending REAL Custom HTML Email...');
      const customEmailDto = {
        to: TEST_EMAIL,
        subject: '🎉 REAL EMAIL TEST - All Types Successfully Sent!',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0;">
            <div style="background: white; margin: 20px; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #24AAFF 0%, #1e90ff 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">🚀 REAL EMAIL TEST</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Integration Test Completed Successfully!</p>
              </div>

              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Hi John Doe! 👋</h2>
                  <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0;">
                    This email confirms that <strong>ALL email types</strong> were successfully sent from the Ayahay Email Service!
                  </p>
                </div>

                <!-- Status Cards -->
                <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 25px 0;">
                  <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px;">✅ Emails Sent Successfully:</h3>
                  
                  <div style="display: grid; gap: 10px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                      <strong>📧 Welcome Email</strong> - Priority: HIGH
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                      <strong>🔐 Password Reset Email</strong> - Priority: CRITICAL
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                      <strong>✉️ Email Verification</strong> - Priority: HIGH
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #6f42c1;">
                      <strong>💌 Custom HTML Email</strong> - Priority: NORMAL (this one!)
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #fd7e14;">
                      <strong>📮 Bulk Emails</strong> - Coming next...
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #20c997;">
                      <strong>⏰ Scheduled Email</strong> - Coming next...
                    </div>
                  </div>
                </div>

                <!-- Stats -->
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
                    <h3 style="margin: 0 0 10px 0;">📊 Test Statistics</h3>
                    <p style="margin: 5px 0; font-size: 14px;">✨ All Templates: welcome, password_reset, email_verification</p>
                    <p style="margin: 5px 0; font-size: 14px;">⚡ All Priorities: LOW, NORMAL, HIGH, CRITICAL</p>
                    <p style="margin: 5px 0; font-size: 14px;">🎯 Target Email: ${TEST_EMAIL}</p>
                    <p style="margin: 5px 0; font-size: 14px;">🕐 Test Time: ${new Date().toLocaleString()}</p>
                  </div>
                </div>

                <!-- Call to Action -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://app.ayahay.com" style="background: #24AAFF; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; transition: all 0.3s ease;">
                    🚀 Visit Ayahay Dashboard
                  </a>
                </div>

                <div style="text-align: center; color: #666; font-size: 14px; line-height: 1.6;">
                  <p>This email was generated by the <strong>Ayahay Email Service</strong> integration test.</p>
                  <p>If you received this, it means all email systems are working perfectly! 🎉</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #666; margin: 0; font-size: 12px;">
                  © 2024 Ayahay Email Service | Powered by AWS SES & NestJS
                </p>
              </div>
            </div>
          </div>
        `,
        text: `
🎉 REAL EMAIL TEST - All Types Successfully Sent!

Hi John Doe!

This email confirms that ALL email types were successfully sent from the Ayahay Email Service!

✅ Emails Sent Successfully:
- 📧 Welcome Email (Priority: HIGH)
- 🔐 Password Reset Email (Priority: CRITICAL)  
- ✉️ Email Verification (Priority: HIGH)
- 💌 Custom HTML Email (Priority: NORMAL) - this one!
- 📮 Bulk Emails - Coming next...
- ⏰ Scheduled Email - Coming next...

📊 Test Statistics:
✨ All Templates: welcome, password_reset, email_verification
⚡ All Priorities: LOW, NORMAL, HIGH, CRITICAL
🎯 Target Email: ${TEST_EMAIL}
🕐 Test Time: ${new Date().toLocaleString()}

This email was generated by the Ayahay Email Service integration test.
If you received this, it means all email systems are working perfectly! 🎉

© 2024 Ayahay Email Service | Powered by AWS SES & NestJS
        `,
        priority: EmailPriority.NORMAL,
      };

      const customEmailResult = await controller.sendEmail(customEmailDto);
      expect(customEmailResult.success).toBe(true);
      console.log('✅ Custom HTML Email sent successfully!');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. BULK EMAILS
      console.log('📮 Sending REAL Bulk Emails...');
      const bulkEmailDto = {
        emails: [
          {
            to: TEST_EMAIL,
            templateName: 'welcome',
            templateVariables: {
              name: 'John Doe',
              appName: 'Ayahay Bulk Test #1',
              dashboardUrl: 'https://app.ayahay.com/dashboard',
            },
            priority: EmailPriority.NORMAL,
          },
          {
            to: TEST_EMAIL,
            subject: '📦 Bulk Email #2 - Integration Test',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #24AAFF;">📦 Bulk Email Test #2</h1>
                <p>Hi John Doe,</p>
                <p>This is the <strong>second email</strong> in the bulk email test.</p>
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>🔢 Bulk Email Details:</h3>
                  <ul>
                    <li>Email #1: Welcome template</li>
                    <li>Email #2: Custom content (this one)</li>
                    <li>Email #3: Password reset template</li>
                  </ul>
                </div>
                <p>All emails are being sent to: <code>${TEST_EMAIL}</code></p>
                <p>Best regards,<br/>Ayahay Email Service</p>
              </div>
            `,
            priority: EmailPriority.NORMAL,
          },
          {
            to: TEST_EMAIL,
            templateName: 'password_reset',
            templateVariables: {
              name: 'John Doe',
              resetUrl: 'https://app.ayahay.com/reset-password?token=bulk-test-token-456',
              expirationTime: '30 minutes',
              supportEmail: 'support@ayahay.com',
            },
            priority: EmailPriority.LOW,
          },
        ],
        batchSize: 2,
      };

      const bulkEmailResult = await controller.sendBulkEmail(bulkEmailDto);
      expect(bulkEmailResult.success).toBe(true);
      console.log(`✅ Bulk Emails sent successfully! (${bulkEmailDto.emails.length} emails)`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 6. SCHEDULED EMAIL
      console.log('⏰ Scheduling REAL Email...');
      const scheduledDate = new Date(Date.now() + 120000); // 2 minutes from now
      const scheduledEmailDto = {
        to: TEST_EMAIL,
        subject: '⏰ SCHEDULED EMAIL - Integration Test Complete!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 30px; border-radius: 15px;">
              <h1 style="color: #28a745; text-align: center;">⏰ Scheduled Email Delivered!</h1>
              <p>Hi John Doe,</p>
              
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #28a745;">
                <h2>🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!</h2>
                <p>This scheduled email confirms that <strong>ALL email types</strong> were successfully sent and processed:</p>
                
                <h3>📋 Complete Test Summary:</h3>
                <ol style="line-height: 1.8;">
                  <li>✅ <strong>Welcome Email</strong> - Template with variables</li>
                  <li>✅ <strong>Password Reset Email</strong> - Secure reset link</li>
                  <li>✅ <strong>Email Verification</strong> - Verification code and URL</li>
                  <li>✅ <strong>Custom HTML Email</strong> - Rich content with styling</li>
                  <li>✅ <strong>Bulk Emails</strong> - 3 emails processed in batches</li>
                  <li>✅ <strong>Scheduled Email</strong> - This one! Delivered at the right time</li>
                </ol>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h4>📊 Final Statistics:</h4>
                  <ul>
                    <li><strong>Total Emails:</strong> 7+ real emails sent</li>
                    <li><strong>Target Email:</strong> ${TEST_EMAIL}</li>
                    <li><strong>Templates Used:</strong> welcome, password_reset, email_verification</li>
                    <li><strong>Priorities Tested:</strong> LOW, NORMAL, HIGH, CRITICAL</li>
                    <li><strong>Scheduled For:</strong> ${scheduledDate.toLocaleString()}</li>
                    <li><strong>Test Completed:</strong> ${new Date().toLocaleString()}</li>
                  </ul>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #28a745; color: white; padding: 20px; border-radius: 10px;">
                  <h2 style="margin: 0;">🚀 ALL SYSTEMS OPERATIONAL!</h2>
                  <p style="margin: 10px 0 0 0;">Ayahay Email Service is working perfectly!</p>
                </div>
              </div>

              <p style="text-align: center; color: #666;">
                <small>This email was automatically scheduled and delivered by the Ayahay Email Service.<br/>
                Integration test completed at ${new Date().toLocaleString()}</small>
              </p>
            </div>
          </div>
        `,
        text: `
⏰ SCHEDULED EMAIL - Integration Test Complete!

Hi John Doe,

🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!

This scheduled email confirms that ALL email types were successfully sent:

📋 Complete Test Summary:
1. ✅ Welcome Email - Template with variables
2. ✅ Password Reset Email - Secure reset link  
3. ✅ Email Verification - Verification code and URL
4. ✅ Custom HTML Email - Rich content with styling
5. ✅ Bulk Emails - 3 emails processed in batches
6. ✅ Scheduled Email - This one! Delivered at the right time

📊 Final Statistics:
- Total Emails: 7+ real emails sent
- Target Email: ${TEST_EMAIL}
- Templates Used: welcome, password_reset, email_verification
- Priorities Tested: LOW, NORMAL, HIGH, CRITICAL
- Scheduled For: ${scheduledDate.toLocaleString()}
- Test Completed: ${new Date().toLocaleString()}

🚀 ALL SYSTEMS OPERATIONAL!
Ayahay Email Service is working perfectly!

This email was automatically scheduled and delivered by the Ayahay Email Service.
Integration test completed at ${new Date().toLocaleString()}
        `,
        scheduledAt: scheduledDate.toISOString(),
        priority: EmailPriority.LOW,
      };

      const scheduledEmailResult = await controller.scheduleEmail(scheduledEmailDto);
      expect(scheduledEmailResult.success).toBe(true);
      console.log(`✅ Scheduled Email queued successfully for ${scheduledDate.toLocaleString()}`);

      // FINAL SUMMARY
      console.log('\n🎉 ALL REAL EMAILS SENT SUCCESSFULLY!');
      console.log('📊 FINAL SUMMARY:');
      console.log('   ✅ Welcome Email: SENT');
      console.log('   ✅ Password Reset Email: SENT');
      console.log('   ✅ Email Verification Email: SENT');
      console.log('   ✅ Custom HTML Email: SENT');
      console.log('   ✅ Bulk Emails (3 emails): SENT');
      console.log('   ✅ Scheduled Email: QUEUED');
      console.log(`   📧 All emails sent to: ${TEST_EMAIL}`);
      console.log('   🎯 All priorities tested: LOW, NORMAL, HIGH, CRITICAL');
      console.log('   📋 All templates tested: welcome, password_reset, email_verification');
      console.log(`   ⏰ Scheduled email will be delivered at: ${scheduledDate.toLocaleString()}`);
      console.log('\n🚀 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
      console.log(`📬 CHECK YOUR EMAIL INBOX: ${TEST_EMAIL}`);
      console.log('💡 You should receive 6+ emails immediately + 1 scheduled email in 2 minutes');
      console.log('\n');

    } catch (error) {
      console.error('❌ INTEGRATION TEST FAILED:', error);
      throw error;
    }
  }, 60000); // 60 second timeout for real email sending

  it('should verify queue status after sending emails', async () => {
    console.log('\n📊 Checking queue status after sending emails...');
    
    const queueStatus = await controller.getQueueStatus();
    expect(queueStatus.success).toBe(true);
    
    console.log('Queue Status:', queueStatus.data);
    console.log('✅ Queue status check completed');
  });

  it('should verify health check after integration test', async () => {
    console.log('\n🏥 Performing health check after integration test...');
    
    const healthCheck = await controller.healthCheck();
    expect(healthCheck.success).toBe(true);
    
    console.log('Health Check:', healthCheck.data);
    console.log('✅ Health check completed successfully');
  });
});