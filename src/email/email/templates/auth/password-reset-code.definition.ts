import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
  PasswordResetCodeTemplateVariables,
} from '../../types/template.types';
import PasswordResetCodeEmail from './password-reset-code';

export const passwordResetCodeTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'password_reset_code',
    displayName: 'Password Reset OTP Code',
    description:
      'Email sent to users who request a password reset with a 6-digit OTP code',
    category: TemplateCategory.AUTH,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['password', 'reset', 'otp', 'security', 'authentication'],
    lastModified: new Date('2024-01-01'),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'resetCode',
        type: 'string',
        required: true,
        description: '6-digit OTP code for password reset',
        validation: {
          pattern: '^[0-9A-Z]{6}$',
        },
        examples: ['123456', '987654'],
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
        name: 'expiresIn',
        type: 'string',
        required: false,
        description: 'Time until the code expires',
        defaultValue: '5 minutes',
        examples: ['5 minutes', '10 minutes', '1 hour'],
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
      resetCode: '123456',
      expiresIn: '5 minutes',
      supportEmail: 'support@ayahay.com',
    },
  },

  renderFunction: async (
    variables: PasswordResetCodeTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(PasswordResetCodeEmail, variables),
    );

    const greeting = variables.name ? `Hello ${variables.name}` : 'Hello';
    const expiration = variables.expiresIn || '5 minutes';

    return {
      subject: 'Your Password Reset Code',
      html: emailHtml,
      text: `${greeting},

You recently requested to reset your password. Use the verification code below to proceed:

${variables.resetCode}

This code will expire in ${expiration}. If you did not request a password reset, please ignore this email or contact our support team.

${variables.supportEmail ? `Need help? Contact us at ${variables.supportEmail}` : ''}

Best regards,
The Ayahay Team`,
    };
  },
};
