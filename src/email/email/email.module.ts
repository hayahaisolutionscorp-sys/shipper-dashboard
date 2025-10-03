import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisService } from '../../redis/redis.service';
import { TemplateService } from './services/template.service';
import { TemplateRegistryService } from './services/template-registry.service';
import { TemplateLoaderService } from './services/template-loader.service';
import { AwsSesProvider } from './providers/aws-ses/aws-ses.provider';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProcessor } from './processors/email.processor';
import { EmailController } from './controllers/email.controller';
import { EmailConfigService } from './config/email.config.service';
import { EmailErrorHandler } from './exceptions/email-error.handler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [
    RedisService,
    TemplateRegistryService,
    TemplateLoaderService,
    TemplateService,
    EmailConfigService,
    EmailErrorHandler,
    AwsSesProvider,
    EmailQueueService,
    EmailProcessor,
  ],
  controllers: [EmailController],
  exports: [
    EmailQueueService,
    TemplateService,
    TemplateRegistryService,
    AwsSesProvider,
    EmailConfigService,
    EmailErrorHandler,
    BullModule,
  ],
})
export class EmailModule {}
