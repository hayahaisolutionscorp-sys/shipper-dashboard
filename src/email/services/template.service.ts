import { Injectable, Logger } from '@nestjs/common';
import { TemplateRegistryService } from './template-registry.service';
import {
  EmailTemplate,
  TemplateVariablesFor,
  TemplateVariableRegistry,
} from '../types/template.types';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private templateRegistry: TemplateRegistryService) {}

  /**
   * Render template with type safety - recommended approach
   */
  async renderTemplate<T extends keyof TemplateVariableRegistry>(
    templateName: T,
    variables: TemplateVariablesFor<T>,
  ): Promise<EmailTemplate> {
    const result = await this.templateRegistry.renderTemplate(
      templateName,
      variables,
      { validateVariables: true },
    );
    return result.template;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use renderTemplate with type-safe parameters instead
   */
  async renderTemplateLegacy(
    templateName: string,
    variables: Record<string, any>,
  ): Promise<EmailTemplate> {
    this.logger.warn(
      `Using legacy renderTemplate method for '${templateName}'. Consider using type-safe version.`,
    );

    // Map legacy template names to new names if needed
    const mappedName = this.mapLegacyTemplateName(templateName);

    const result = await this.templateRegistry.renderTemplate(
      mappedName as keyof TemplateVariableRegistry,
      variables,
      { validateVariables: true },
    );
    return result.template;
  }

  /**
   * Get template preview data for testing
   */
  getTemplatePreview(templateName: string): Record<string, any> | undefined {
    return this.templateRegistry.getTemplatePreview(templateName);
  }

  /**
   * Check if template exists and is active
   */
  isTemplateAvailable(templateName: string): boolean {
    return this.templateRegistry.validateTemplateExists(templateName);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return this.templateRegistry
      .searchTemplates({ isActive: true })
      .map((template) => template.metadata.name);
  }

  /**
   * Get template variable schema for validation
   */
  getTemplateSchema(templateName: string) {
    return this.templateRegistry.getTemplateSchema(templateName);
  }

  /**
   * Map legacy template names to new registry names
   */
  private mapLegacyTemplateName(legacyName: string): string {
    const nameMap: Record<string, string> = {
      welcome: 'welcome',
      password_reset: 'password_reset',
      passwordReset: 'password_reset',
      magic_link: 'magic_link',
      magicLink: 'magic_link',
      verification: 'magic_link',
    };

    return nameMap[legacyName] || legacyName;
  }
}
