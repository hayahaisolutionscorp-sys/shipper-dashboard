import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
} from '../../email/types/template.types';
import BookingConfirmation from './booking-confirmation';

// Define the template variables interface
export interface BookingConfirmationTemplateVariables {
  customerName: string;
  booking: {
    bookingReference: string;
    bookingDate: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: 'Paid' | 'Pending' | 'Failed';
  };
  trip: {
    route: {
      from: string;
      to: string;
    };
    departure: {
      date: string;
      time: string;
      terminal: string;
    };
    arrival: {
      date: string;
      time: string;
      terminal: string;
    };
    vessel: string;
    duration: string;
    seatClass: string;
  };
  passengers: Array<{
    name: string;
    type: 'Adult' | 'Child' | 'Infant' | 'Senior';
    discountType?: string;
  }>;
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
  checkInUrl?: string;
  supportPhone?: string;
}

export const bookingConfirmationTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'booking_confirmation',
    displayName: 'Booking Confirmation',
    description:
      'Ferry booking confirmation email with trip details, passenger information, and payment summary',
    category: TemplateCategory.TRANSACTIONAL,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: ['booking', 'confirmation', 'ferry', 'maritime', 'travel'],
    lastModified: new Date(),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'customerName',
        type: 'string',
        required: true,
        description: 'Name of the customer who made the booking',
        examples: ['Juan Dela Cruz', 'Maria Santos', 'John Doe'],
      },
      {
        name: 'booking',
        type: 'object',
        required: true,
        description: 'Booking details including reference, payment, and dates',
        examples: ['AYH-2024-001234', 'MNL-2024-002341', 'CEB-2024-000123'],
      },
      {
        name: 'trip',
        type: 'object',
        required: true,
        description:
          'Trip details including route, schedule, and vessel information',
        examples: [
          'Manila to Cebu',
          'Cebu to Bohol',
          'Batangas to Puerto Princesa',
        ],
      },
      {
        name: 'passengers',
        type: 'array',
        required: true,
        description: 'List of passengers with names, types, and discounts',
        examples: [
          'Juan Dela Cruz (Adult)',
          'Maria Santos (Adult)',
          'Jose Garcia (Child, Student Discount)',
        ],
      },
      {
        name: 'brand',
        type: 'object',
        required: true,
        description:
          'Brand context for company branding and contact information',
      },
      {
        name: 'checkInUrl',
        type: 'url',
        required: false,
        description: 'URL for online check-in (if available)',
        examples: ['https://app.ayahay.com/check-in?ref=AYH-2024-001234'],
      },
      {
        name: 'supportPhone',
        type: 'string',
        required: false,
        description: 'Support phone number for customer assistance',
        examples: ['+63 (2) 8888-0000', '+1 555-123-4567'],
      },
    ],
    previewData: {
      customerName: 'Juan Dela Cruz',
      booking: {
        bookingReference: 'AYH-2024-001234',
        bookingDate: '2024-01-15T10:30:00Z',
        totalAmount: 2850.0,
        currency: 'PHP',
        paymentMethod: 'Credit Card (****1234)',
        paymentStatus: 'Paid',
      },
      trip: {
        route: { from: 'Manila', to: 'Cebu' },
        departure: {
          date: '2024-01-20',
          time: '08:00 AM',
          terminal: 'Manila North Harbor',
        },
        arrival: {
          date: '2024-01-21',
          time: '06:00 AM',
          terminal: 'Cebu Port',
        },
        vessel: 'MV Ayahay Princess',
        duration: '22 hours',
        seatClass: 'Economy',
      },
      passengers: [
        { name: 'Juan Dela Cruz', type: 'Adult' },
        { name: 'Maria Dela Cruz', type: 'Adult' },
        {
          name: 'Jose Dela Cruz',
          type: 'Child',
          discountType: 'Student Discount',
        },
      ],
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
      checkInUrl: 'https://app.ayahay.com/check-in?ref=AYH-2024-001234',
      supportPhone: '+63 (2) 8888-0000',
    },
  },

  renderFunction: async (
    variables: BookingConfirmationTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(
      React.createElement(BookingConfirmation, variables),
    );

    const route = `${variables.trip.route.from} to ${variables.trip.route.to}`;

    return {
      subject: `Booking Confirmed - ${variables.booking.bookingReference}`,
      html: emailHtml,
      text: `Hello ${variables.customerName},

Your ferry booking has been confirmed!

Booking Reference: ${variables.booking.bookingReference}

Trip Details:
Route: ${route}
Departure: ${variables.trip.departure.date} at ${variables.trip.departure.time}
From: ${variables.trip.departure.terminal}
Arrival: ${variables.trip.arrival.date} at ${variables.trip.arrival.time}
To: ${variables.trip.arrival.terminal}
Vessel: ${variables.trip.vessel}
Class: ${variables.trip.seatClass}

Passengers (${variables.passengers.length}):
${variables.passengers.map((p) => `• ${p.name} (${p.type})`).join('\n')}

Payment Details:
Total Amount: ${new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: variables.booking.currency,
      }).format(variables.booking.totalAmount)}
Payment Method: ${variables.booking.paymentMethod}
Status: ${variables.booking.paymentStatus}

Important Reminders:
• Arrive at the terminal at least 30 minutes before departure
• Bring valid government-issued ID for all passengers
• Check weather conditions before traveling
• Keep this confirmation for your records

${variables.checkInUrl ? `Check-in online: ${variables.checkInUrl}` : ''}

Need assistance? Contact us at ${variables.brand.contact.email}${variables.supportPhone ? ` or call ${variables.supportPhone}` : ''}.

Thank you for choosing ${variables.brand.companyName}!
Safe travels across the beautiful Philippine waters`,
    };
  },
};
