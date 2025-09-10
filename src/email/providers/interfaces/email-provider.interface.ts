export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  messageId: string;
  status: 'sent' | 'failed' | 'queued';
  provider: string;
  timestamp: Date;
  error?: string;
}

export interface BulkEmailResult {
  success: EmailResult[];
  failed: EmailResult[];
  totalSent: number;
  totalFailed: number;
}

export interface ProviderHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  lastChecked: Date;
}

export interface EmailProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  /**
   * Send a single email
   */
  sendEmail(params: SendEmailParams): Promise<EmailResult>;

  /**
   * Send multiple emails (batch operation)
   */
  sendBulkEmail(emails: SendEmailParams[]): Promise<BulkEmailResult>;

  /**
   * Validate provider configuration
   */
  validateConfiguration(): Promise<boolean>;

  /**
   * Check provider health status
   */
  healthCheck(): Promise<ProviderHealthCheck>;

  /**
   * Get provider-specific limits (rate limits, size limits, etc.)
   */
  getLimits(): {
    maxRecipientsPerEmail: number;
    maxEmailsPerSecond: number;
    maxAttachmentSize: number;
    maxEmailSize: number;
  };
}
