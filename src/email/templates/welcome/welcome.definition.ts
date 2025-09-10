import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
  WelcomeTemplateVariables,
} from '../../types/template.types';
import { WelcomeEmail } from './welcome';

export const welcomeTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'welcome',
    displayName: 'Welcome Email',
    description:
      'Welcome email sent to new users after successful registration',
    category: TemplateCategory.WELCOME,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['welcome', 'onboarding', 'registration'],
    lastModified: new Date('2024-01-01'),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: "The user's full name or first name",
        validation: {
          minLength: 1,
          maxLength: 100,
        },
        examples: ['John Doe', 'Jane Smith', 'Alex'],
      },
      {
        name: 'appName',
        type: 'string',
        required: true,
        description: 'The name of the application',
        validation: {
          minLength: 1,
          maxLength: 50,
        },
        examples: ['Ayahay', 'MyApp'],
      },
      {
        name: 'dashboardUrl',
        type: 'url',
        required: false,
        description: 'URL to the user dashboard or main application page',
        examples: [
          'https://app.ayahay.com/dashboard',
          'https://myapp.com/home',
        ],
      },
      {
        name: 'supportEmail',
        type: 'email',
        required: false,
        description: 'Support email address for user questions',
        defaultValue: 'support@ayahay.com',
        examples: ['support@ayahay.com', 'help@myapp.com'],
      },
    ],
    previewData: {
      name: 'John Doe',
      appName: 'Ayahay',
      dashboardUrl: 'https://app.ayahay.com/dashboard',
      supportEmail: 'support@ayahay.com',
    },
  },

  renderFunction: async (
    variables: WelcomeTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(WelcomeEmail, variables),
    );

    return {
      subject: `Welcome to ${variables.appName}!`,
      html: emailHtml,
      text: `Hello ${variables.name}, welcome to ${variables.appName}! Thanks for joining us. ${
        variables.dashboardUrl
          ? `Get started by visiting your dashboard: ${variables.dashboardUrl}`
          : ''
      } ${
        variables.supportEmail
          ? `If you have any questions, feel free to reach out to us at ${variables.supportEmail}.`
          : ''
      }`,
    };
  },
};
