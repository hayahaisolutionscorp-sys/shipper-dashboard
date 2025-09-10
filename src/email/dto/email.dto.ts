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

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class SendEmailDto {
  @IsEmail({}, { each: true })
  @Transform(
    ({ value }) => (Array.isArray(value) ? value : [value]) as string[],
  )
  to: string | string[];

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsObject()
  templateVariables?: Record<string, any>;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;

  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class WelcomeEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  name: string;

  @IsString()
  appName: string;

  @IsOptional()
  @IsString()
  dashboardUrl?: string;

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;
}

export class PasswordResetEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  resetUrl: string;

  @IsOptional()
  @IsString()
  expirationTime?: string;

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;
}

export class BulkEmailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  @ArrayMinSize(1)
  emails: SendEmailDto[];

  @IsOptional()
  @IsNumber()
  batchSize?: number;
}

export class ScheduleEmailDto extends SendEmailDto {
  @IsDateString()
  scheduledAt: string;
}
