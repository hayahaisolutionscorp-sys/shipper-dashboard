import { Generated } from 'kysely';

export interface Database {
  email_logs: EmailLogsTable;
}

export interface EmailLogsTable {
  id: Generated<number>;
  recipient: string;
  subject: string | null;
  status: string;
  sent_at: Generated<Date>;
  provider_response: string | null;
  job_id: string | null;
}
