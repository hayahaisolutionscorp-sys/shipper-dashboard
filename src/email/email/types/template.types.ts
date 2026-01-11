export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  category: TemplateCategory;
  version: string;
  author?: string;
  tags?: string[];
  previewUrl?: string;
  lastModified: Date;
  isActive: boolean;
}

export enum TemplateCategory {
  AUTH = 'auth',
  MARKETING = 'marketing',
  TRANSACTIONAL = 'transactional',
  NOTIFICATION = 'notification',
  WELCOME = 'welcome',
  SYSTEM = 'system',
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  examples?: string[];
}

export interface TemplateSchema {
  variables: TemplateVariable[];
  previewData?: Record<string, any>;
}

export interface RegisteredTemplate {
  metadata: TemplateMetadata;
  schema: TemplateSchema;
  renderFunction: (variables: Record<string, any>) => Promise<EmailTemplate>;
  validateVariables?: (
    variables: Record<string, any>,
  ) => Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface TemplateRenderOptions {
  validateVariables?: boolean;
  includeMetadata?: boolean;
  generatePreview?: boolean;
}

export interface TemplateRenderResult {
  template: EmailTemplate;
  metadata?: TemplateMetadata;
  validationResult?: ValidationResult;
  renderTime?: number;
}

export interface TemplateSearchOptions {
  category?: TemplateCategory;
  tags?: string[];
  isActive?: boolean;
  name?: string;
  searchText?: string;
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  templatesByCategory: Record<TemplateCategory, number>;
  mostUsedTemplates: Array<{
    name: string;
    usageCount: number;
  }>;
  lastUpdated: Date;
}

// Type-safe template variable definitions for specific templates
export interface WelcomeTemplateVariables {
  name: string;
  appName: string;
  dashboardUrl?: string;
  supportEmail?: string;
}

export interface PasswordResetTemplateVariables {
  name?: string;
  resetUrl: string;
  expirationTime?: string;
  supportEmail?: string;
}

export interface EmailVerificationTemplateVariables {
  name?: string;
  verificationCode: string;
  verificationUrl?: string;
  expiresIn?: string;
}

export interface PasswordResetCodeTemplateVariables {
  name?: string;
  resetCode: string;
  expiresIn?: string;
  supportEmail?: string;
}

// Legacy alias for backwards compatibility
export interface MagicLinkTemplateVariables extends EmailVerificationTemplateVariables {}

// Template type registry for type safety
export interface TemplateVariableRegistry {
  welcome: WelcomeTemplateVariables;
  password_reset: PasswordResetTemplateVariables;
  password_reset_code: PasswordResetCodeTemplateVariables;
  email_verification: EmailVerificationTemplateVariables;
}

export type TemplateVariablesFor<T extends keyof TemplateVariableRegistry> =
  TemplateVariableRegistry[T];
