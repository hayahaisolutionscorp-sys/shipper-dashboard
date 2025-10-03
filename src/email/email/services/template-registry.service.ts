import { Injectable, Logger } from '@nestjs/common';
import {
  RegisteredTemplate,
  TemplateMetadata,
  TemplateSearchOptions,
  TemplateRenderOptions,
  TemplateRenderResult,
  TemplateStats,
  ValidationResult,
  ValidationError,
  TemplateCategory,
  TemplateVariable,
  TemplateVariablesFor,
  TemplateVariableRegistry,
} from '../types/template.types';
import { EmailTemplateException } from '../exceptions/email.exceptions';

@Injectable()
export class TemplateRegistryService {
  private readonly logger = new Logger(TemplateRegistryService.name);
  private templates = new Map<string, RegisteredTemplate>();
  private usageStats = new Map<string, number>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Register a new template in the registry
   */
  registerTemplate(template: RegisteredTemplate): void {
    const { name } = template.metadata;

    if (this.templates.has(name)) {
      this.logger.warn(`Template '${name}' already exists. Overwriting.`);
    }

    // Validate template metadata
    this.validateTemplateMetadata(template.metadata);

    // Validate template schema
    this.validateTemplateSchema(template);

    this.templates.set(name, template);
    this.logger.log(`Template '${name}' registered successfully`);
  }

  /**
   * Get a template by name
   */
  getTemplate(name: string): RegisteredTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): RegisteredTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Search templates based on criteria
   */
  searchTemplates(options: TemplateSearchOptions = {}): RegisteredTemplate[] {
    let results = this.getAllTemplates();

    if (options.category) {
      results = results.filter((t) => t.metadata.category === options.category);
    }

    if (options.isActive !== undefined) {
      results = results.filter((t) => t.metadata.isActive === options.isActive);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter((t) =>
        options.tags!.some((tag) => t.metadata.tags?.includes(tag)),
      );
    }

    if (options.name) {
      results = results.filter((t) =>
        t.metadata.name.toLowerCase().includes(options.name!.toLowerCase()),
      );
    }

    if (options.searchText) {
      const searchTerm = options.searchText.toLowerCase();
      results = results.filter(
        (t) =>
          t.metadata.name.toLowerCase().includes(searchTerm) ||
          t.metadata.displayName.toLowerCase().includes(searchTerm) ||
          t.metadata.description.toLowerCase().includes(searchTerm) ||
          t.metadata.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm),
          ),
      );
    }

    return results;
  }

  /**
   * Render a template with type-safe variables
   */
  async renderTemplate<T extends keyof TemplateVariableRegistry>(
    templateName: T,
    variables: TemplateVariablesFor<T>,
    options: TemplateRenderOptions = {},
  ): Promise<TemplateRenderResult> {
    const startTime = Date.now();

    const template = this.getTemplate(templateName);
    if (!template) {
      throw new EmailTemplateException(
        `Template '${templateName}' not found`,
        templateName,
      );
    }

    if (!template.metadata.isActive) {
      throw new EmailTemplateException(
        `Template '${templateName}' is inactive`,
        templateName,
      );
    }

    let validationResult: ValidationResult | undefined;

    // Validate variables if requested or if template has validation
    if (options.validateVariables !== false && template.validateVariables) {
      validationResult = await template.validateVariables(variables);

      if (!validationResult.isValid) {
        throw new EmailTemplateException(
          `Template variables validation failed for '${templateName}'`,
          templateName,
          validationResult.errors.map((e) => e.field),
        );
      }
    } else if (options.validateVariables !== false) {
      // Default validation based on schema
      validationResult = this.validateVariablesAgainstSchema(
        variables as unknown as Record<string, unknown>,
        template.schema.variables,
      );

      if (!validationResult.isValid) {
        throw new EmailTemplateException(
          `Template variables validation failed for '${templateName}'`,
          templateName,
          validationResult.errors.map((e) => e.field),
        );
      }
    }

    try {
      const renderedTemplate = await template.renderFunction(variables);
      const renderTime = Date.now() - startTime;

      // Update usage stats
      this.updateUsageStats(templateName);

      const result: TemplateRenderResult = {
        template: renderedTemplate,
        renderTime,
      };

      if (options.includeMetadata) {
        result.metadata = template.metadata;
      }

      if (validationResult) {
        result.validationResult = validationResult;
      }

      this.logger.debug(
        `Template '${templateName}' rendered in ${renderTime}ms`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to render template '${templateName}':`, error);
      throw new EmailTemplateException(
        `Failed to render template '${templateName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        templateName,
      );
    }
  }

  /**
   * Get template statistics
   */
  getStats(): TemplateStats {
    const allTemplates = this.getAllTemplates();
    const activeTemplates = allTemplates.filter((t) => t.metadata.isActive);

    const templatesByCategory = Object.values(TemplateCategory).reduce(
      (acc, category) => {
        acc[category] = allTemplates.filter(
          (t) => t.metadata.category === category,
        ).length;
        return acc;
      },
      {} as Record<TemplateCategory, number>,
    );

    const mostUsedTemplates = Array.from(this.usageStats.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, usageCount]) => ({ name, usageCount }));

    return {
      totalTemplates: allTemplates.length,
      activeTemplates: activeTemplates.length,
      templatesByCategory,
      mostUsedTemplates,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get template preview data
   */
  getTemplatePreview(templateName: string): Record<string, any> | undefined {
    const template = this.getTemplate(templateName);
    return template?.schema.previewData;
  }

  /**
   * Validate template exists and is active
   */
  validateTemplateExists(templateName: string): boolean {
    const template = this.getTemplate(templateName);
    return template !== undefined && template.metadata.isActive;
  }

  /**
   * Get template variable schema
   */
  getTemplateSchema(templateName: string): TemplateVariable[] | undefined {
    const template = this.getTemplate(templateName);
    return template?.schema.variables;
  }

  /**
   * Remove a template from registry
   */
  unregisterTemplate(templateName: string): boolean {
    if (this.templates.has(templateName)) {
      this.templates.delete(templateName);
      this.usageStats.delete(templateName);
      this.logger.log(`Template '${templateName}' unregistered`);
      return true;
    }
    return false;
  }

  /**
   * Clear all templates (useful for testing)
   */
  clearTemplates(): void {
    this.templates.clear();
    this.usageStats.clear();
    this.logger.warn('All templates cleared from registry');
  }

  /**
   * Validate template metadata
   */
  private validateTemplateMetadata(metadata: TemplateMetadata): void {
    if (!metadata.name || metadata.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (!metadata.displayName || metadata.displayName.trim().length === 0) {
      throw new Error('Template displayName is required');
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      throw new Error('Template description is required');
    }

    if (!Object.values(TemplateCategory).includes(metadata.category)) {
      throw new Error(`Invalid template category: ${metadata.category}`);
    }

    if (!metadata.version || metadata.version.trim().length === 0) {
      throw new Error('Template version is required');
    }
  }

  /**
   * Validate template schema
   */
  private validateTemplateSchema(template: RegisteredTemplate): void {
    if (
      !template.schema.variables ||
      !Array.isArray(template.schema.variables)
    ) {
      throw new Error('Template schema must contain variables array');
    }

    // Validate each variable definition
    for (const variable of template.schema.variables) {
      if (!variable.name || variable.name.trim().length === 0) {
        throw new Error('Template variable name is required');
      }

      if (
        !['string', 'number', 'boolean', 'date', 'url', 'email'].includes(
          variable.type,
        )
      ) {
        throw new Error(`Invalid variable type: ${variable.type}`);
      }
    }
  }

  /**
   * Validate variables against schema
   */
  private validateVariablesAgainstSchema(
    variables: Record<string, unknown>,
    schema: TemplateVariable[],
  ): ValidationResult {
    const errors: ValidationError[] = [];

    for (const variable of schema) {
      const value = variables[variable.name];

      // Check required variables
      if (
        variable.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push({
          field: variable.name,
          message: `${variable.name} is required`,
          code: 'REQUIRED_FIELD_MISSING',
          value,
        });
        continue;
      }

      // Skip validation if optional and not provided
      if (!variable.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (variable.type === 'email' && value && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: variable.name,
            message: `${variable.name} must be a valid email address`,
            code: 'INVALID_EMAIL',
            value,
          });
        }
      }

      if (variable.type === 'url' && value && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          errors.push({
            field: variable.name,
            message: `${variable.name} must be a valid URL`,
            code: 'INVALID_URL',
            value,
          });
        }
      }

      // Length validation for strings
      if (variable.type === 'string' && typeof value === 'string') {
        if (
          variable.validation?.minLength &&
          value.length < variable.validation.minLength
        ) {
          errors.push({
            field: variable.name,
            message: `${variable.name} must be at least ${variable.validation.minLength} characters long`,
            code: 'MIN_LENGTH_VIOLATION',
            value,
          });
        }

        if (
          variable.validation?.maxLength &&
          value.length > variable.validation.maxLength
        ) {
          errors.push({
            field: variable.name,
            message: `${variable.name} must be at most ${variable.validation.maxLength} characters long`,
            code: 'MAX_LENGTH_VIOLATION',
            value,
          });
        }

        if (variable.validation?.pattern) {
          const regex = new RegExp(variable.validation.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: variable.name,
              message: `${variable.name} does not match required format`,
              code: 'PATTERN_MISMATCH',
              value,
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(templateName: string): void {
    const currentCount = this.usageStats.get(templateName) || 0;
    this.usageStats.set(templateName, currentCount + 1);
  }

  /**
   * Initialize default templates with proper metadata
   */
  private initializeDefaultTemplates(): void {
    // This method will be populated when we register the actual templates
    this.logger.log('Template registry initialized');
  }
}
