import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Ayahay Email API')
    .setDescription('Email service with queue-based processing using BullMQ, Redis, and AWS SES')
    .setVersion('1.0')
    .addTag('email', 'Email operations')
    .addTag('queue', 'Queue management')
    .addTag('health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`📚 Swagger API docs available at: http://localhost:${process.env.PORT ?? 3001}/api`);
}
void bootstrap();