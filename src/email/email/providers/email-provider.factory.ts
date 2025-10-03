import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './interfaces/email-provider.interface';
import { AwsSesProvider } from './aws-ses/aws-ses.provider';
import { TemplateService } from '../services/template.service';

export type EmailProviderType = 'aws-ses' | 'sendgrid' | 'mailgun' | 'smtp';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);
  private providers = new Map<EmailProviderType, EmailProvider>();
  private currentProvider: EmailProvider | null = null;

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  /**
   * Get the current active email provider
   */
  getCurrentProvider(): EmailProvider {
    if (!this.currentProvider) {
      throw new Error('No email provider is configured');
    }
    return this.currentProvider;
  }

  /**
   * Get a specific provider by type
   */
  getProvider(type: EmailProviderType): EmailProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get all available providers
   */
  getAllProviders(): EmailProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all configured (ready to use) providers
   */
  getConfiguredProviders(): EmailProvider[] {
    return this.getAllProviders().filter((provider) => provider.isConfigured);
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(type: EmailProviderType): Promise<boolean> {
    const provider = this.providers.get(type);

    if (!provider) {
      this.logger.error(`Provider ${type} not found`);
      return false;
    }

    if (!provider.isConfigured) {
      this.logger.error(`Provider ${type} is not configured`);
      return false;
    }

    try {
      const isValid = await provider.validateConfiguration();
      if (!isValid) {
        this.logger.error(`Provider ${type} configuration validation failed`);
        return false;
      }

      this.currentProvider = provider;
      this.logger.log(`Switched to email provider: ${type}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to switch to provider ${type}:`, error);
      return false;
    }
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealth(): Promise<
    Array<{
      name: string;
      type: EmailProviderType;
      isConfigured: boolean;
      health: Awaited<ReturnType<EmailProvider['healthCheck']>>;
    }>
  > {
    const healthChecks = Array.from(this.providers.entries()).map(
      async ([type, provider]) => {
        try {
          const health = await provider.healthCheck();
          return {
            name: provider.name,
            type,
            isConfigured: provider.isConfigured,
            health,
          };
        } catch (error) {
          return {
            name: provider.name,
            type,
            isConfigured: provider.isConfigured,
            health: {
              status: 'unhealthy' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
              lastChecked: new Date(),
            },
          };
        }
      },
    );

    return Promise.all(healthChecks);
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders(): void {
    // Register AWS SES provider
    try {
      const awsSesProvider = new AwsSesProvider(
        this.configService,
        // Note: We'll need to inject TemplateService properly
        {} as TemplateService, // Temporary placeholder - will be properly injected
      );
      this.providers.set('aws-ses', awsSesProvider);

      if (awsSesProvider.isConfigured) {
        this.currentProvider = awsSesProvider;
        this.logger.log('AWS SES provider set as default');
      }
    } catch (error) {
      this.logger.warn('Failed to initialize AWS SES provider:', error);
    }

    // TODO: Add other providers here
    // this.providers.set('sendgrid', new SendGridProvider(...));
    // this.providers.set('mailgun', new MailgunProvider(...));

    // Set fallback provider based on configuration
    this.setDefaultProvider();
  }

  /**
   * Set the default provider based on configuration
   */
  private setDefaultProvider(): void {
    const configuredProvider = this.configService.get<EmailProviderType>(
      'email.provider',
      'aws-ses',
    );

    if (this.currentProvider) {
      this.logger.log(
        `Email provider already set: ${this.currentProvider.name}`,
      );
      return;
    }

    const provider = this.providers.get(configuredProvider);
    if (provider?.isConfigured) {
      this.currentProvider = provider;
      this.logger.log(`Set default email provider: ${configuredProvider}`);
    } else {
      // Try to find any configured provider as fallback
      const fallbackProvider = this.getConfiguredProviders()[0];
      if (fallbackProvider) {
        this.currentProvider = fallbackProvider;
        this.logger.warn(
          `Configured provider ${configuredProvider} not available, using fallback: ${fallbackProvider.name}`,
        );
      } else {
        this.logger.error('No email providers are properly configured');
      }
    }
  }
}
