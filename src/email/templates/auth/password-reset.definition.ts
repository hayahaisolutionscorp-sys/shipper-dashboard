import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
  PasswordResetTemplateVariables,
} from '../../types/template.types';
import { PasswordResetEmail } from './password-reset';

export const passwordResetTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'password_reset',
    displayName: 'Password Reset',
    description:
      'Email sent to users who request a password reset with a secure reset link',
    category: TemplateCategory.AUTH,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['password', 'reset', 'security', 'authentication'],
    lastModified: new Date('2024-01-01'),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'resetUrl',
        type: 'url',
        required: true,
        description: 'Secure URL for password reset, should include token',
        validation: {
          pattern: '^https://.+',
        },
        examples: [
          'https://app.ayahay.com/reset-password?token=abc123',
          'https://myapp.com/auth/reset?token=xyz789',
        ],
      },
      {
        name: 'name',
        type: 'string',
        required: false,
        description: "The user's name (if available)",
        validation: {
          maxLength: 100,
        },
        examples: ['John Doe', 'Jane', 'Alex Smith'],
      },
      {
        name: 'expirationTime',
        type: 'string',
        required: false,
        description: 'Human-readable expiration time for the reset link',
        defaultValue: '1 hour',
        examples: ['30 minutes', '1 hour', '24 hours'],
      },
      {
        name: 'supportEmail',
        type: 'email',
        required: false,
        description: 'Support email for users who need help',
        defaultValue: 'support@ayahay.com',
        examples: ['support@ayahay.com', 'help@myapp.com'],
      },
    ],
    previewData: {
      name: 'John Doe',
      resetUrl: 'https://app.ayahay.com/reset-password?token=sample-token-123',
      expirationTime: '1 hour',
      supportEmail: 'support@ayahay.com',
    },
  },

  renderFunction: async (
    variables: PasswordResetTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(PasswordResetEmail, variables),
    );

    const greeting = variables.name ? `Hello ${variables.name}` : 'Hello';
    const expiration = variables.expirationTime || '1 hour';

    return {
      subject: 'Reset Your Password',
      html: emailHtml,
      text: `${greeting},

You recently requested to reset your password. Click the link below to reset it:

${variables.resetUrl}

This link will expire in ${expiration}. If you did not request a password reset, please ignore this email or contact our support team.

${variables.supportEmail ? `Need help? Contact us at ${variables.supportEmail}` : ''}

Best regards,
The Ayahay Team`,
    };
  },
};
