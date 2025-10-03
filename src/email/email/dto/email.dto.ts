import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es). Can be a single email or array of emails.',
    example: 'user@example.com',
    oneOf: [
      { type: 'string', example: 'user@example.com' },
      { type: 'array', items: { type: 'string' }, example: ['user1@example.com', 'user2@example.com'] },
    ],
  })
  @IsEmail({}, { each: true })
  @Transform(
    ({ value }) => (Array.isArray(value) ? value : [value]) as string[],
  )
  to: string | string[];

  @ApiPropertyOptional({
    description: 'Name of the email template to use (welcome, password_reset, email_verification, etc.)',
    example: 'welcome',
  })
  @IsOptional()
  @IsString()
  templateName?: string;

  @ApiPropertyOptional({
    description: 'Variables to populate the email template',
    example: { name: 'John Doe', appName: 'Ayahay', dashboardUrl: 'https://app.ayahay.com' },
  })
  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Email subject line (required if not using template)',
    example: 'Welcome to Ayahay!',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'HTML content of the email (required if not using template)',
    example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Plain text version of the email',
    example: 'Welcome! Thank you for joining us.',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Priority level for email processing',
    enum: EmailPriority,
    example: EmailPriority.NORMAL,
    default: EmailPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;

  @ApiPropertyOptional({
    description: 'Delay in milliseconds before sending the email',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class WelcomeEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'newuser@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'User\'s full name',
    example: 'Juan Dela Cruz',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Name of the application',
    example: 'Ayahay Ferry Booking',
  })
  @IsString()
  appName: string;

  @ApiPropertyOptional({
    description: 'URL to the user dashboard',
    example: 'https://app.ayahay.com/dashboard',
  })
  @IsOptional()
  @IsString()
  dashboardUrl?: string;

  @ApiPropertyOptional({
    description: 'Priority level for email processing',
    enum: EmailPriority,
    example: EmailPriority.HIGH,
    default: EmailPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;
}

export class PasswordResetEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @IsEmail()
  to: string;

  @ApiPropertyOptional({
    description: 'User\'s name (optional for personalization)',
    example: 'Maria Santos',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Password reset URL with token',
    example: 'https://app.ayahay.com/reset-password?token=abc123xyz',
  })
  @IsString()
  resetUrl: string;

  @ApiPropertyOptional({
    description: 'How long the reset link is valid for',
    example: '1 hour',
  })
  @IsOptional()
  @IsString()
  expirationTime?: string;

  @ApiPropertyOptional({
    description: 'Priority level for email processing',
    enum: EmailPriority,
    example: EmailPriority.HIGH,
    default: EmailPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;
}

export class BulkEmailDto {
  @ApiProperty({
    description: 'Array of emails to send',
    type: [SendEmailDto],
    example: [
      {
        to: 'user1@example.com',
        templateName: 'newsletter',
        templateVariables: { title: 'Monthly Update' },
        priority: 'normal',
      },
      {
        to: 'user2@example.com',
        templateName: 'newsletter',
        templateVariables: { title: 'Monthly Update' },
        priority: 'normal',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  @ArrayMinSize(1)
  emails: SendEmailDto[];

  @ApiPropertyOptional({
    description: 'Number of emails to process per batch',
    example: 50,
    default: 100,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  batchSize?: number;
}

export class ScheduleEmailDto extends SendEmailDto {
  @ApiProperty({
    description: 'ISO 8601 date-time string for when to send the email',
    example: '2025-12-31T23:59:59Z',
  })
  @IsDateString()
  scheduledAt: string;
}
