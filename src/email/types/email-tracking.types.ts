export enum EmailStatus {
  DONE = 'done',
  FAILED = 'failed',
}

export interface EmailLog {
  id: string;
  reference_id?: string; // booking ID, user ID, etc.
  template_name: string;
  subject: string;
  recipient_email: string;
  sender_email: string;
  metadata?: Record<string, any>; // All template variables and brand context
  status: EmailStatus;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface CreateEmailLogDto {
  reference_id?: string;
  template_name: string;
  subject: string;
  recipient_email: string;
  sender_email?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEmailStatusDto {
  status: EmailStatus;
  error_message?: string;
}

export interface EmailLogQuery {
  status?: EmailStatus;
  template_name?: string;
  recipient_email?: string;
  reference_id?: string;
  api_base_url?: string; // Query by tenant using metadata
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}
