import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TemplateRegistryService } from './template-registry.service';
import { welcomeTemplateDefinition } from '../templates/welcome/welcome.definition';
import { passwordResetTemplateDefinition } from '../templates/auth/password-reset.definition';
import { emailVerificationTemplateDefinition } from '../templates/auth/email-verification.definition';

@Injectable()
export class TemplateLoaderService implements OnModuleInit {
  private readonly logger = new Logger(TemplateLoaderService.name);

  constructor(private templateRegistry: TemplateRegistryService) {}

  onModuleInit(): void {
    this.loadAllTemplates();
  }

  /**
   * Load all template definitions into the registry
   */
  private loadAllTemplates(): void {
    const templates = [
      welcomeTemplateDefinition,
      passwordResetTemplateDefinition,
      emailVerificationTemplateDefinition,
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const template of templates) {
      try {
        this.templateRegistry.registerTemplate(template);
        loadedCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(
          `Failed to load template '${template.metadata.name}':`,
          error,
        );
      }
    }

    this.logger.log(
      `Template loading completed: ${loadedCount} loaded, ${failedCount} failed`,
    );

    if (loadedCount > 0) {
      const stats = this.templateRegistry.getStats();
      this.logger.log(
        `Total templates in registry: ${stats.totalTemplates} (${stats.activeTemplates} active)`,
      );
    }
  }

  /**
   * Reload all templates (useful for development)
   */
  reloadTemplates(): void {
    this.logger.log('Reloading all templates...');
    this.templateRegistry.clearTemplates();
    this.loadAllTemplates();
  }

  /**
   * Get template loading status
   */
  getLoadingStatus(): {
    isLoaded: boolean;
    templateCount: number;
    activeTemplateCount: number;
  } {
    const stats = this.templateRegistry.getStats();
    return {
      isLoaded: stats.totalTemplates > 0,
      templateCount: stats.totalTemplates,
      activeTemplateCount: stats.activeTemplates,
    };
  }
}
