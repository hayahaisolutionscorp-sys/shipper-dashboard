import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
} from '../../email/types/template.types';
import { GeneralEmail } from './general-email';
import { BrandContext } from '../../types/brand.types';

export interface GeneralEmailTemplateVariables {
  brand: BrandContext;
  subject: string;
  body: string;
}

export const generalEmailTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'general',
    displayName: 'General Email',
    description:
      'General purpose email with customizable body text and brand context',
    category: TemplateCategory.TRANSACTIONAL,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['general', 'custom', 'branded'],
    lastModified: new Date('2024-01-01'),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'brand',
        type: 'object',
        required: true,
        description: 'Brand context with company information and styling',
        examples: [
          'Full brand context object with apiBaseUrl, logo, contact, etc.',
        ],
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Email subject line',
        validation: {
          minLength: 1,
          maxLength: 200,
        },
        examples: [
          'Important Update from 2GO Travel',
          'Ferry Schedule Changes',
          'Booking Confirmation',
        ],
      },
      {
        name: 'body',
        type: 'string',
        required: true,
        description: 'Email body content (supports line breaks)',
        validation: {
          minLength: 1,
          maxLength: 5000,
        },
        examples: [
          'Dear valued customer,\n\nWe are writing to inform you about important changes to our ferry schedules.\n\nBest regards,\nThe Team',
          'Your booking has been confirmed for the Manila to Cebu route on December 15, 2024.',
        ],
      },
    ],
    previewData: {
      brand: {
        apiBaseUrl: 'https://api.2go.com',
        logo: 'https://cdn.2go.com/logo-email.png',
        contact: {
          email: 'support@2go.com',
          phone: '+63 (2) 8888 2GO',
          website: 'https://2go.com.ph',
          address: 'Philippines',
        },
        companyName: '2GO Travel',
        brandName: '2GO Travel - Your Ferry Connection',
        colors: {
          primary: '#FF6B35',
          secondary: '#1E40AF',
          background: '#F8FAFC',
        },
        links: {
          dashboard: 'https://app.2go.com',
          support: 'https://2go.com.ph/support',
          website: 'https://2go.com.ph',
        },
        locale: 'en-PH',
        timezone: 'Asia/Manila',
      },
      subject: 'Important Ferry Schedule Update',
      body: `Dear Valued Customer,

We hope this message finds you well. We are writing to inform you about important updates to our ferry schedules effective January 1, 2025.

Key Changes:
• Manila to Cebu route: New departure time at 8:00 PM
• Cebu to Bohol route: Additional sailing on Wednesdays
• All weekend schedules remain unchanged

These changes are designed to better serve you and provide more flexible travel options across the Philippine islands.

If you have existing bookings that may be affected, our customer service team will contact you directly to discuss alternative arrangements.

Thank you for choosing 2GO Travel for your inter-island transportation needs.

Safe travels!`,
    },
  },

  renderFunction: async (
    variables: GeneralEmailTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(GeneralEmail, variables),
    );

    return {
      subject: variables.subject,
      html: emailHtml,
      text: `${variables.body}

---
${variables.brand.companyName}
${variables.brand.contact.email}`,
    };
  },
};
