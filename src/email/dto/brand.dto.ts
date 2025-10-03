import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ContactDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}

export class ColorsDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsString()
  secondary?: string;

  @IsOptional()
  @IsString()
  background?: string;
}

export class LinksDto {
  @IsOptional()
  @IsUrl()
  dashboard?: string;

  @IsOptional()
  @IsUrl()
  support?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  privacyPolicy?: string;

  @IsOptional()
  @IsUrl()
  termsOfService?: string;
}

export class BrandContextDto {
  @IsUrl()
  apiBaseUrl: string;

  @IsUrl()
  logo: string;

  @ValidateNested()
  @Type(() => ContactDto)
  contact: ContactDto;

  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColorsDto)
  colors?: ColorsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LinksDto)
  links?: LinksDto;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

// Simplified brand props for API requests
export class SimpleBrandDto {
  @IsUrl()
  apiBaseUrl: string;

  @IsUrl()
  logo: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsUrl()
  dashboardUrl?: string;

  @IsOptional()
  @IsUrl()
  supportUrl?: string;
}
