import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
} from '../../email/types/template.types';
import RefundConfirmation from './refund-confirmation';

export interface RefundConfirmationTemplateVariables {
  customerName?: string;
  refund: {
    refundReference: string;
    originalBookingReference: string;
    refundAmount: number;
    currency: string;
    refundMethod: string;
    processingDays: number;
    refundDate: string;
    reason:
      | 'customer_request'
      | 'trip_cancellation'
      | 'schedule_change'
      | 'other';
  };
  originalTrip: {
    route: {
      from: string;
      to: string;
    };
    departure: {
      date: string;
      time: string;
    };
    vessel: string;
  };
  brand: {
    apiBaseUrl: string;
    logo: string;
    contact: {
      email: string;
      phone?: string;
      website?: string;
      address?: string;
    };
    companyName: string;
    brandName?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
    };
    links?: {
      dashboard?: string;
      support?: string;
      website?: string;
      privacyPolicy?: string;
      termsOfService?: string;
    };
    locale?: string;
    timezone?: string;
  };
  supportEmail?: string;
  supportPhone?: string;
}

export const refundConfirmationTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'refund_confirmation',
    displayName: 'Refund Confirmation',
    description:
      'Refund confirmation email with refund details, processing timeline, and customer support information',
    category: TemplateCategory.TRANSACTIONAL,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['refund', 'confirmation', 'ferry', 'payment', 'customer-service'],
    lastModified: new Date(),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'customerName',
        type: 'string',
        required: false,
        description: 'Name of the customer receiving the refund',
        examples: ['Juan Dela Cruz', 'Maria Santos', 'John Doe'],
      },
      {
        name: 'refund',
        type: 'object',
        required: true,
        description: 'Refund details including amount, method, and timeline',
        examples: ['REF-2024-001234'],
      },
      {
        name: 'originalTrip',
        type: 'object',
        required: true,
        description: 'Original trip details that was refunded',
        examples: ['Manila to Cebu on 2024-01-20'],
      },
      {
        name: 'brand',
        type: 'object',
        required: true,
        description:
          'Brand context for company branding and contact information',
      },
      {
        name: 'supportEmail',
        type: 'string',
        required: false,
        description: 'Support email for refund inquiries',
        examples: ['refunds@ayahay.com', 'support@ayahay.com'],
      },
      {
        name: 'supportPhone',
        type: 'string',
        required: false,
        description: 'Support phone number for refund inquiries',
        examples: ['+63 (2) 8888-0000', '+1 555-123-4567'],
      },
    ],
    previewData: {
      customerName: 'Juan Dela Cruz',
      refund: {
        refundReference: 'REF-2024-001234',
        originalBookingReference: 'AYH-2024-001234',
        refundAmount: 2850.0,
        currency: 'PHP',
        refundMethod: 'Credit Card (****1234)',
        processingDays: 5,
        refundDate: '2024-01-15T10:30:00Z',
        reason: 'customer_request',
      },
      originalTrip: {
        route: { from: 'Manila', to: 'Cebu' },
        departure: {
          date: '2024-01-20',
          time: '08:00 AM',
        },
        vessel: 'MV Ayahay Princess',
      },
      brand: {
        apiBaseUrl: 'https://api.ayahay.com',
        logo: 'https://cdn.ayahay.com/logo-email.png',
        contact: {
          email: 'support@ayahay.com',
          phone: '+63 (2) 8888-0000',
        },
        companyName: 'Ayahay',
        colors: { primary: '#1E40AF' },
      },
      supportEmail: 'refunds@ayahay.com',
      supportPhone: '+63 (2) 8888-0000',
    },
  },

  renderFunction: async (
    variables: RefundConfirmationTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(RefundConfirmation, variables),
    );

    const route = `${variables.originalTrip.route.from} to ${variables.originalTrip.route.to}`;
    const reasonText = {
      customer_request: 'customer request',
      trip_cancellation: 'trip cancellation',
      schedule_change: 'schedule change',
      other: 'other reasons',
    }[variables.refund.reason];

    return {
      subject: `Refund Confirmed - ${variables.refund.refundReference}`,
      html: emailHtml,
      text: `Hello ${variables.customerName || 'Valued Customer'},

Your refund has been processed successfully!

Refund Details:
Refund Reference: ${variables.refund.refundReference}
Original Booking: ${variables.refund.originalBookingReference}
Refund Amount: ${new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: variables.refund.currency,
      }).format(variables.refund.refundAmount)}
Refund Method: ${variables.refund.refundMethod}
Processing Date: ${new Date(variables.refund.refundDate).toLocaleDateString()}
Expected in Account: ${variables.refund.processingDays} business days
Reason: ${reasonText}

Original Trip Details:
Route: ${route}
Departure: ${variables.originalTrip.departure.date} at ${variables.originalTrip.departure.time}
Vessel: ${variables.originalTrip.vessel}

Important Information:
• Refunds are processed within ${variables.refund.processingDays} business days
• You will receive the refund via your original payment method
• Processing times may vary depending on your bank/card issuer
• Keep this confirmation for your records

Have questions about your refund? Contact us:
${variables.supportEmail ? `Email: ${variables.supportEmail}` : `Email: ${variables.brand.contact.email}`}
${variables.supportPhone ? `Phone: ${variables.supportPhone}` : variables.brand.contact.phone ? `Phone: ${variables.brand.contact.phone}` : ''}

Thank you for choosing ${variables.brand.companyName}. We look forward to serving you again!`,
    };
  },
};
