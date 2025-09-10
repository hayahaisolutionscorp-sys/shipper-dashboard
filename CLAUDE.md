# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Ayahay Email Service** - a specialized NestJS microservice for handling email operations with queue-based processing, built for a logistics/shipping company. The service uses React Email templates, AWS SES for delivery, and BullMQ with Redis for reliable queue processing.

## Development Commands

**Setup & Development:**
```bash
pnpm install              # Install dependencies
pnpm dev                  # Start Redis + development server
pnpm start:dev            # Development with watch mode
pnpm start:debug          # Debug mode
pnpm start:prod           # Production mode
```

**Redis Management:**
```bash
pnpm redis:start          # Start Redis master
pnpm redis:dashboard      # Start Redis Commander UI (port 8081)
pnpm redis:stop           # Stop Redis services
pnpm redis:logs           # View Redis logs
```

**Email Templates:**
```bash
pnpm email               # React Email development server
```

**Testing & Quality:**
```bash
pnpm test                # Unit tests
pnpm test:e2e            # End-to-end tests
pnpm test:cov            # Coverage report
pnpm lint                # ESLint + Prettier
pnpm format              # Code formatting
```

## Architecture Overview

**Core Stack:**
- **NestJS 11** with TypeScript
- **BullMQ + Redis** for queue processing
- **AWS SES** for email delivery
- **React Email** for template system
- **Redis Sentinel** for high availability

**Key Design Patterns:**
- **Queue-based Processing** - All emails processed asynchronously
- **Template Service Pattern** - Centralized email template rendering
- **Provider Pattern** - Pluggable email providers (currently AWS SES)
- **Module-based Architecture** - Clean separation of concerns

## Module Structure

```
src/
├── app.module.ts          # Root module configuration
├── main.ts                # Bootstrap (port 3001)
├── email/                 # Core email functionality
│   ├── email.module.ts    # Email module with Bull queue setup
│   ├── email.controller.ts# REST endpoints
│   ├── email-queue.service.ts # Queue management
│   ├── email.processor.ts # Queue job processing
│   ├── template.service.ts# React Email rendering
│   ├── providers/aws.ses.providers.ts # AWS SES integration
│   └── templates/         # React Email templates
├── redis/redis.service.ts # Redis with Sentinel support
└── bull-board.controller.ts # Queue monitoring dashboard
```

## API Endpoints

**Email Operations:**
- `POST /email/send` - Queue generic email
- `POST /email/send/welcome` - Queue welcome email
- `POST /email/send/password-reset` - Queue password reset
- `POST /email/send/bulk` - Queue bulk emails
- `POST /email/schedule` - Schedule email for later

**Queue Management:**
- `GET /email/queue/status` - Get queue statistics
- `POST /email/queue/pause` - Pause processing
- `POST /email/queue/resume` - Resume processing
- `POST /email/queue/clean` - Clean completed jobs

**Monitoring:**
- `GET /admin/queues/*` - Bull Dashboard for queue monitoring

## Configuration

**Required Environment Variables:**
```bash
PORT=3001
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
EMAIL_PROVIDER=aws-ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_SES_SENDER=noreply@example.com
```

**Redis Infrastructure:**
- Master-Replica setup with 3 Sentinel instances
- High availability configuration with automatic failover
- Redis Commander web UI for monitoring

## Development Workflow

1. **Start Redis:** `pnpm redis:start`
2. **Run Development:** `pnpm start:dev` 
3. **Template Development:** `pnpm email` (separate terminal)
4. **Monitor Queues:** Visit `http://localhost:3001/admin/queues`
5. **Monitor Redis:** Visit `http://localhost:8081`

## Queue System

**Job Processing:**
- Priority-based processing (critical, high, normal, low)
- Batch processing for bulk emails
- Scheduled emails with delay support
- Retry logic with exponential backoff
- Comprehensive job monitoring

**Template System:**
Templates use React Email with TypeScript support:
```typescript
await emailQueueService.sendWelcomeEmail(
  'user@example.com',
  { name: 'John', appName: 'Ayahay', dashboardUrl: 'https://app.ayahay.com' },
  { priority: 'high' }
);
```

## Key Dependencies

- `@nestjs/bullmq` - Queue integration
- `@bull-board/express` - Queue monitoring UI
- `@aws-sdk/client-ses` - AWS SES integration  
- `@react-email/components` - Email template components
- `bullmq` - Queue processing
- `redis` - Redis client with Sentinel support

## Testing

Run `pnpm test` for unit tests, `pnpm test:e2e` for integration tests. The codebase includes comprehensive testing for queue processing, email sending, and template rendering.