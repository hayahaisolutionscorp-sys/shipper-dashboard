<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Ayahay Email Service API Documentation

A specialized NestJS microservice for handling email operations with queue-based processing, React Email templates, and AWS SES integration.

## Base URL
```
http://localhost:3001
```

## API Endpoints

### Email Operations

#### 1. Send Generic Email
**POST** `/email/send`

Send a generic email with custom content or template.

**Request Body:**
```json
{
  "to": "user@example.com", // or ["user1@example.com", "user2@example.com"]
  "templateName": "welcome", // optional - template to use
  "templateVariables": { // optional - variables for template
    "name": "John Doe",
    "appName": "Ayahay"
  },
  "subject": "Custom Subject", // optional if using template
  "html": "<h1>Custom HTML</h1>", // optional if using template
  "text": "Custom text content", // optional
  "priority": "normal", // optional: low, normal, high, critical
  "delay": 5000 // optional: delay in milliseconds
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email queued successfully",
  "statusCode": 200
}
```

#### 2. Send Welcome Email
**POST** `/email/send/welcome`

Send a welcome email using the predefined welcome template.

**Request Body:**
```json
{
  "to": "user@example.com",
  "name": "John Doe", // required
  "appName": "Ayahay", // required
  "dashboardUrl": "https://app.ayahay.com/dashboard", // optional
  "priority": "high" // optional: low, normal, high, critical
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email queued successfully",
  "statusCode": 200
}
```

#### 3. Send Password Reset Email
**POST** `/email/send/password-reset`

Send a password reset email with secure reset link.

**Request Body:**
```json
{
  "to": "user@example.com",
  "name": "John Doe", // optional
  "resetUrl": "https://app.ayahay.com/reset-password?token=abc123", // required
  "expirationTime": "1 hour", // optional, defaults to "24 hours"
  "priority": "high" // optional: low, normal, high, critical
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email queued successfully",
  "statusCode": 200
}
```

#### 4. Send Bulk Emails
**POST** `/email/send/bulk`

Send multiple emails in batches for better performance.

**Request Body:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "templateName": "welcome",
      "templateVariables": {
        "name": "User 1",
        "appName": "Ayahay"
      }
    },
    {
      "to": "user2@example.com",
      "subject": "Custom Email",
      "html": "<h1>Hello User 2</h1>"
    }
  ],
  "batchSize": 10 // optional, number of emails to process in each batch
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk email job queued for 2 emails",
  "statusCode": 200
}
```

#### 5. Schedule Email
**POST** `/email/schedule`

Schedule an email to be sent at a specific time.

**Request Body:**
```json
{
  "to": "user@example.com",
  "templateName": "welcome", // optional
  "templateVariables": { // optional
    "name": "John Doe",
    "appName": "Ayahay"
  },
  "subject": "Scheduled Email", // optional if using template
  "html": "<h1>Scheduled Content</h1>", // optional if using template
  "text": "Scheduled text content", // optional
  "priority": "normal", // optional
  "scheduledAt": "2024-12-31T23:59:59.000Z" // required: ISO date string
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email scheduled for 2024-12-31T23:59:59.000Z",
  "statusCode": 200
}
```

### Queue Management

#### 6. Get Queue Status
**GET** `/email/queue/status`

Get current queue statistics and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 1,
    "paused": false
  },
  "statusCode": 200
}
```

#### 7. Pause Queue
**POST** `/email/queue/pause`

Pause email processing queue.

**Response:**
```json
{
  "success": true,
  "message": "Queue paused successfully",
  "statusCode": 200
}
```

#### 8. Resume Queue
**POST** `/email/queue/resume`

Resume email processing queue.

**Response:**
```json
{
  "success": true,
  "message": "Queue resumed successfully",
  "statusCode": 200
}
```

#### 9. Clean Queue
**POST** `/email/queue/clean`

Clean completed and failed jobs from queue.

**Response:**
```json
{
  "success": true,
  "message": "Queue cleaned successfully",
  "statusCode": 200
}
```

### Health Check

#### 10. Health Check
**GET** `/email/health`

Check service health including Redis and queue status.

**Response:**
```json
{
  "success": true,
  "data": {
    "redis": {
      "status": "connected",
      "uptime": 3600
    },
    "queue": {
      "waiting": 0,
      "active": 0,
      "completed": 50,
      "failed": 0
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "statusCode": 200
}
```

## Available Email Templates

### 1. Welcome Template (`welcome`)
**Variables:**
- `name` (required): User's name
- `appName` (required): Application name
- `dashboardUrl` (optional): Link to user dashboard
- `supportEmail` (optional): Support contact email

### 2. Password Reset Template (`password_reset`)
**Variables:**
- `resetUrl` (required): Secure password reset URL
- `name` (optional): User's name
- `expirationTime` (optional): How long the link is valid
- `supportEmail` (optional): Support contact email

### 3. Email Verification Template (`email_verification`)
**Variables:**
- `verificationCode` (required): Verification code
- `name` (optional): User's name
- `verificationUrl` (optional): Direct verification link
- `expiresIn` (optional): Code expiration time

## Priority Levels

- `low`: Non-critical emails (newsletters, notifications)
- `normal`: Standard emails (default)
- `high`: Important emails (password resets, account changes)
- `critical`: Urgent emails (security alerts, system notifications)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "statusCode": 400
}
```

## Queue Monitoring Dashboard

Access the Bull Dashboard for visual queue monitoring:
```
http://localhost:3001/admin/queues
```

## Redis Commander (Development)

Monitor Redis in development:
```
http://localhost:8081
```

## Testing

### Unit Tests
Run the standard unit tests that use mocked services:
```bash
pnpm test
```

### Integration Tests
Run the **real email integration test** that actually sends emails to a real email address:

```bash
# Configure target email address in the test file first
pnpm test real-email-integration.spec.ts
```

**⚠️ IMPORTANT:** This test sends **REAL EMAILS** using AWS SES. Make sure:
1. AWS SES is properly configured with valid credentials
2. Redis is running (`pnpm redis:start`)
3. Update the `TEST_EMAIL` variable in the test file with your email address

### What the Integration Test Does

The real email integration test (`real-email-integration.spec.ts`) sends **all email types** to demonstrate the complete functionality:

#### **Emails Sent:**
1. **📧 Welcome Email** - Using welcome template with variables
2. **🔐 Password Reset Email** - Secure reset link with expiration
3. **✉️ Email Verification Email** - Verification code and URL
4. **💌 Custom HTML Email** - Rich styled content with summary
5. **📮 Bulk Emails (3 emails)** - Batch processing demonstration
   - Welcome template email
   - Custom HTML content email  
   - Password reset template email
6. **⏰ Scheduled Email** - Delivered 2 minutes after test completion

#### **Test Coverage:**
- ✅ All email templates: `welcome`, `password_reset`, `email_verification`
- ✅ All priority levels: `LOW`, `NORMAL`, `HIGH`, `CRITICAL`
- ✅ Custom HTML content with CSS styling
- ✅ Template variable substitution
- ✅ Bulk email processing
- ✅ Scheduled email delivery
- ✅ Queue status monitoring
- ✅ Health check verification

#### **Expected Results:**
- **6+ emails** delivered immediately to your inbox
- **1 scheduled email** delivered 2 minutes later
- **Queue statistics** showing processed jobs
- **All tests pass** with detailed console output

#### **Sample Test Output:**
```
🎉 ALL REAL EMAILS SENT SUCCESSFULLY!
📊 FINAL SUMMARY:
   ✅ Welcome Email: SENT
   ✅ Password Reset Email: SENT
   ✅ Email Verification Email: SENT
   ✅ Custom HTML Email: SENT
   ✅ Bulk Emails (3 emails): SENT
   ✅ Scheduled Email: QUEUED
   📧 All emails sent to: your-email@example.com
   🎯 All priorities tested: LOW, NORMAL, HIGH, CRITICAL
   📋 All templates tested: welcome, password_reset, email_verification
```

#### **Configuring the Test:**
1. Open `src/email/controllers/real-email-integration.spec.ts`
2. Update the `TEST_EMAIL` constant:
   ```typescript
   const TEST_EMAIL = 'your-email@example.com';
   ```
3. Ensure AWS SES credentials are configured in `.env`
4. Start Redis: `pnpm redis:start`
5. Run the test: `pnpm test real-email-integration.spec.ts`

#### **Troubleshooting:**
- **Failed emails in queue**: Check AWS SES sandbox restrictions
- **Redis connection errors**: Ensure Redis is running with `pnpm redis:start`
- **AWS SES errors**: Verify credentials and sender verification
- **Template errors**: Check template syntax and variable requirements

This integration test serves as both a comprehensive test suite and a demonstration of all email service capabilities.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
