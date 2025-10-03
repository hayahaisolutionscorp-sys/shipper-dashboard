import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
} from '../../email/types/template.types';
import MaintenanceNotice from './maintenance-notice';

export interface MaintenanceNoticeTemplateVariables {
  customerName?: string;
  maintenance: {
    type: 'scheduled' | 'emergency' | 'routine';
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    estimatedDuration: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  affectedServices: {
    vessels?: string[];
    routes?: Array<{
      from: string;
      to: string;
      impact: 'cancelled' | 'delayed' | 'rescheduled' | 'alternative_vessel';
    }>;
    terminals?: string[];
    systems?: string[];
  };
  alternatives?: {
    alternativeRoutes?: Array<{
      from: string;
      to: string;
      vessel: string;
      departureTime: string;
      notes?: string;
    }>;
    rebookingInfo?: {
      automaticRebooking: boolean;
      rebookingUrl?: string;
      rebookingPhone?: string;
      noChargeRebooking: boolean;
    };
    refundInfo?: {
      fullRefundAvailable: boolean;
      refundDeadline?: string;
      refundUrl?: string;
    };
  };
  contact: {
    supportEmail: string;
    supportPhone?: string;
    emergencyPhone?: string;
    operationsEmail?: string;
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
  updateUrl?: string;
}

export const maintenanceNoticeTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'maintenance_notice',
    displayName: 'Maintenance Notice',
    description:
      'Vessel and service maintenance notifications with impact details, alternatives, and customer support information',
    category: TemplateCategory.TRANSACTIONAL,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['maintenance', 'service', 'notification', 'vessel', 'operations'],
    lastModified: new Date(),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'customerName',
        type: 'string',
        required: false,
        description: 'Name of the customer (optional for personalization)',
        examples: ['Juan Dela Cruz', 'Maria Santos'],
      },
      {
        name: 'maintenance',
        type: 'object',
        required: true,
        description: 'Maintenance details including type, duration, and reason',
        examples: [
          'Scheduled engine overhaul',
          'Emergency repairs',
          'Routine inspection',
        ],
      },
      {
        name: 'affectedServices',
        type: 'object',
        required: true,
        description:
          'Services, routes, and systems affected by the maintenance',
        examples: [
          'Manila-Cebu route',
          'MV Ayahay Princess',
          'Terminal facilities',
        ],
      },
      {
        name: 'alternatives',
        type: 'object',
        required: false,
        description: 'Alternative arrangements, rebooking, and refund options',
        examples: ['Alternative vessel assigned', 'Free rebooking available'],
      },
      {
        name: 'contact',
        type: 'object',
        required: true,
        description: 'Contact information for customer support and operations',
        examples: ['operations@ayahay.com', '+63 (2) 8888-0000'],
      },
      {
        name: 'brand',
        type: 'object',
        required: true,
        description:
          'Brand context for company branding and contact information',
      },
      {
        name: 'updateUrl',
        type: 'url',
        required: false,
        description: 'URL for maintenance status updates',
        examples: ['https://app.ayahay.com/maintenance/status'],
      },
    ],
    previewData: {
      customerName: 'Juan Dela Cruz',
      maintenance: {
        type: 'scheduled',
        title: 'MV Ayahay Princess - Scheduled Engine Maintenance',
        description:
          'Comprehensive engine overhaul and safety system upgrades to ensure continued reliable service and enhanced passenger safety.',
        startDate: '2024-02-01T06:00:00Z',
        endDate: '2024-02-03T18:00:00Z',
        estimatedDuration: '60 hours',
        reason:
          'Mandatory annual engine maintenance and safety certification renewal',
        priority: 'medium',
      },
      affectedServices: {
        vessels: ['MV Ayahay Princess'],
        routes: [
          {
            from: 'Manila',
            to: 'Cebu',
            impact: 'alternative_vessel',
          },
          {
            from: 'Cebu',
            to: 'Manila',
            impact: 'alternative_vessel',
          },
        ],
        terminals: [],
        systems: [],
      },
      alternatives: {
        alternativeRoutes: [
          {
            from: 'Manila',
            to: 'Cebu',
            vessel: 'MV Ayahay Explorer',
            departureTime: '8:00 PM daily',
            notes: 'Same amenities and cabin classes available',
          },
        ],
        rebookingInfo: {
          automaticRebooking: true,
          rebookingUrl: 'https://app.ayahay.com/rebook',
          rebookingPhone: '+63 (2) 8888-0000',
          noChargeRebooking: true,
        },
        refundInfo: {
          fullRefundAvailable: true,
          refundDeadline: '2024-01-25',
          refundUrl: 'https://app.ayahay.com/refund',
        },
      },
      contact: {
        supportEmail: 'support@ayahay.com',
        supportPhone: '+63 (2) 8888-0000',
        emergencyPhone: '+63 (2) 8888-9999',
        operationsEmail: 'operations@ayahay.com',
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
      updateUrl: 'https://app.ayahay.com/maintenance/status',
    },
  },

  renderFunction: async (
    variables: MaintenanceNoticeTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(MaintenanceNotice, variables),
    );

    const greeting = variables.customerName
      ? `Dear ${variables.customerName}`
      : 'Dear Valued Customer';
    const priorityText = {
      low: '',
      medium: '[MAINTENANCE NOTICE]',
      high: '[IMPORTANT MAINTENANCE]',
      critical: '[URGENT MAINTENANCE NOTICE]',
    }[variables.maintenance.priority];

    return {
      subject: `${priorityText} ${variables.maintenance.title}`.trim(),
      html: emailHtml,
      text: `${greeting},

${variables.maintenance.title}

${variables.maintenance.description}

MAINTENANCE DETAILS:
Type: ${variables.maintenance.type.replace('_', ' ').toUpperCase()}
Start: ${new Date(variables.maintenance.startDate).toLocaleString()}
End: ${new Date(variables.maintenance.endDate).toLocaleString()}
Duration: ${variables.maintenance.estimatedDuration}
Reason: ${variables.maintenance.reason}

AFFECTED SERVICES:
${variables.affectedServices.vessels?.length ? `Vessels: ${variables.affectedServices.vessels.join(', ')}` : ''}
${variables.affectedServices.routes?.length ? `Routes: ${variables.affectedServices.routes.map((r) => `${r.from} to ${r.to} (${r.impact.replace('_', ' ')})`).join(', ')}` : ''}
${variables.affectedServices.terminals?.length ? `Terminals: ${variables.affectedServices.terminals.join(', ')}` : ''}
${variables.affectedServices.systems?.length ? `Systems: ${variables.affectedServices.systems.join(', ')}` : ''}

${
  variables.alternatives?.alternativeRoutes?.length
    ? `
ALTERNATIVE ARRANGEMENTS:
${variables.alternatives.alternativeRoutes.map((route) => `• ${route.from} to ${route.to} via ${route.vessel} - ${route.departureTime}${route.notes ? ` (${route.notes})` : ''}`).join('\n')}
`
    : ''
}

${
  variables.alternatives?.rebookingInfo
    ? `
REBOOKING OPTIONS:
• ${variables.alternatives.rebookingInfo.automaticRebooking ? 'Automatic rebooking available' : 'Manual rebooking required'}
• ${variables.alternatives.rebookingInfo.noChargeRebooking ? 'No additional charges for rebooking' : 'Rebooking fees may apply'}
${variables.alternatives.rebookingInfo.rebookingUrl ? `• Rebook online: ${variables.alternatives.rebookingInfo.rebookingUrl}` : ''}
${variables.alternatives.rebookingInfo.rebookingPhone ? `• Call: ${variables.alternatives.rebookingInfo.rebookingPhone}` : ''}
`
    : ''
}

${
  variables.alternatives?.refundInfo
    ? `
REFUND OPTIONS:
• ${variables.alternatives.refundInfo.fullRefundAvailable ? 'Full refund available' : 'Partial refund available'}
${variables.alternatives.refundInfo.refundDeadline ? `• Refund deadline: ${variables.alternatives.refundInfo.refundDeadline}` : ''}
${variables.alternatives.refundInfo.refundUrl ? `• Request refund: ${variables.alternatives.refundInfo.refundUrl}` : ''}
`
    : ''
}

CONTACT INFORMATION:
Support: ${variables.contact.supportEmail}${variables.contact.supportPhone ? ` | ${variables.contact.supportPhone}` : ''}
${variables.contact.operationsEmail ? `Operations: ${variables.contact.operationsEmail}` : ''}
${variables.contact.emergencyPhone ? `Emergency: ${variables.contact.emergencyPhone}` : ''}

${variables.updateUrl ? `Live updates: ${variables.updateUrl}` : ''}

We apologize for any inconvenience and appreciate your understanding as we work to maintain the highest safety and service standards.

${variables.brand.companyName} Operations Team`,
    };
  },
};
