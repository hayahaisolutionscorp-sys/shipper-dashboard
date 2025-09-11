import { render } from '@react-email/render';
import * as React from 'react';
import {
  EmailTemplate,
  EmailVerificationTemplateVariables,
  RegisteredTemplate,
  TemplateCategory,
} from '../../types/template.types';
import AyahayEmailVerification from './email-verification';

export const emailVerificationTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'email_verification',
    displayName: 'Email Verification - Ayahay',
    description:
      'Ayahay branded email verification template with verification code and optional magic link for secure account activation',
    category: TemplateCategory.AUTH,
    version: '2.0.0',
    author: 'Ayahay Team',
    tags: [
      'email-verification',
      'ayahay',
      'verification-code',
      'magic-link',
      'authentication',
      'security',
    ],
    lastModified: new Date('2024-12-10'),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'name',
        type: 'string',
        required: false,
        description: "User's name for personalized greeting",
        defaultValue: 'there',
        validation: {
          maxLength: 100,
        },
        examples: ['John Doe', 'Jane Smith', 'Alex'],
      },
      {
        name: 'verificationCode',
        type: 'string',
        required: true,
        description:
          'Six-digit numeric verification code for email verification',
        validation: {
          pattern: '^[0-9]{6}$',
          minLength: 6,
          maxLength: 6,
        },
        examples: ['485729', '123456', '789012'],
      },
      {
        name: 'verificationUrl',
        type: 'url',
        required: false,
        description:
          'Optional direct verification URL (magic link) for one-click verification',
        validation: {
          pattern: '^https://.+',
        },
        examples: [
          'https://ayahay.com/verify?token=abc123xyz',
          'https://app.ayahay.com/auth/verify?code=def456',
        ],
      },
      {
        name: 'expiresIn',
        type: 'string',
        required: false,
        description: 'Human-readable expiration time for the verification code',
        defaultValue: '10 minutes',
        examples: ['10 minutes', '15 minutes', '5 minutes', '1 hour'],
      },
    ],
    previewData: {
      name: 'John Doe',
      verificationCode: '485729',
      verificationUrl:
        'https://ayahay.com/verify?token=sample-verification-token',
      expiresIn: '10 minutes',
    },
  },

  renderFunction: async (
    variables: EmailVerificationTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(AyahayEmailVerification, variables),
    );

    const name = variables.name || 'there';
    const expiresIn = variables.expiresIn || '10 minutes';

    let textContent = `Verify your email address for Ayahay

Hello ${name},

Welcome to Ayahay! To complete your account setup and start using our platform, please verify your email address.`;

    if (variables.verificationCode) {
      textContent += `

Your verification code: ${variables.verificationCode}

This code expires in ${expiresIn}.`;
    }

    if (variables.verificationUrl) {
      textContent += `

Or click this link to verify your email automatically:
${variables.verificationUrl}`;
    }

    textContent += `

🔐 Security Note: Ayahay will never ask you to share your password, credit card, or banking information via email. If you didn't request this verification, please ignore this email.

---
This email verification was sent by Ayahay.
© 2024, Ayahay. All rights reserved.`;

    return {
      subject: 'Verify your email address - Ayahay',
      html: emailHtml,
      text: textContent,
    };
  },
};
