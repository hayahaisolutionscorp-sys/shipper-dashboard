import { render } from '@react-email/render';
import * as React from 'react';
import {
  RegisteredTemplate,
  TemplateCategory,
  EmailTemplate,
} from '../../email/types/template.types';
import Newsletter from './newsletter';

export interface NewsletterTemplateVariables {
  customerName?: string;
  newsletter: {
    title: string;
    edition: string;
    date: string;
    featuredImage?: string;
    introduction: string;
  };
  articles?: Array<{
    title: string;
    summary: string;
    imageUrl?: string;
    readMoreUrl?: string;
    category:
      | 'routes'
      | 'vessels'
      | 'company'
      | 'travel-tips'
      | 'announcements';
  }>;
  promotions?: Array<{
    title: string;
    description: string;
    discountPercent?: number;
    validUntil: string;
    bookingUrl?: string;
    promoCode?: string;
  }>;
  operationalUpdates?: Array<{
    title: string;
    description: string;
    effectiveDate?: string;
    routes?: string[];
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
      unsubscribe?: string;
    };
    locale?: string;
    timezone?: string;
  };
  unsubscribeUrl?: string;
  webViewUrl?: string;
}

export const newsletterTemplateDefinition: RegisteredTemplate = {
  metadata: {
    name: 'newsletter',
    displayName: 'Newsletter',
    description:
      'Company newsletter with articles, promotions, operational updates, and travel information',
    category: TemplateCategory.MARKETING,
    version: '1.0.0',
    author: 'Ayahay Team',
    tags: [
      'newsletter',
      'marketing',
      'updates',
      'promotions',
      'travel',
      'ferry',
    ],
    lastModified: new Date(),
    isActive: true,
  },

  schema: {
    variables: [
      {
        name: 'customerName',
        type: 'string',
        required: false,
        description:
          'Name of the newsletter subscriber (optional for personalization)',
        examples: ['Juan Dela Cruz', 'Maria Santos'],
      },
      {
        name: 'newsletter',
        type: 'object',
        required: true,
        description:
          'Newsletter header information including title, edition, and date',
        examples: ['Island Hopper Weekly - January 2024 Edition'],
      },
      {
        name: 'articles',
        type: 'array',
        required: false,
        description:
          'Newsletter articles with titles, summaries, and optional images',
        examples: [
          'New Route to Palawan',
          'Ferry Safety Guidelines',
          'Island Tourism Updates',
        ],
      },
      {
        name: 'promotions',
        type: 'array',
        required: false,
        description: 'Special offers and promotional deals',
        examples: ['20% off weekend trips', 'Early bird summer bookings'],
      },
      {
        name: 'operationalUpdates',
        type: 'array',
        required: false,
        description:
          'Service updates, schedule changes, and operational announcements',
        examples: ['Manila-Cebu schedule update', 'New vessel deployment'],
      },
      {
        name: 'brand',
        type: 'object',
        required: true,
        description:
          'Brand context for company branding and contact information',
      },
      {
        name: 'unsubscribeUrl',
        type: 'url',
        required: false,
        description: 'URL for newsletter unsubscription',
        examples: ['https://app.ayahay.com/unsubscribe?token=xyz'],
      },
      {
        name: 'webViewUrl',
        type: 'url',
        required: false,
        description: 'URL to view newsletter in web browser',
        examples: ['https://app.ayahay.com/newsletter/2024-01'],
      },
    ],
    previewData: {
      customerName: 'Juan Dela Cruz',
      newsletter: {
        title: 'Island Hopper Weekly',
        edition: 'January 2024 Edition',
        date: '2024-01-15',
        featuredImage: 'https://cdn.ayahay.com/newsletter/header-jan2024.jpg',
        introduction:
          'Welcome to our monthly newsletter featuring the latest updates on routes, vessels, and island travel across the beautiful Philippines.',
      },
      articles: [
        {
          title: 'New Direct Route: Manila to Palawan',
          summary:
            'We are excited to announce our newest route connecting Manila directly to Puerto Princesa, Palawan. Starting February 2024, enjoy comfortable overnight journeys to the last frontier.',
          imageUrl: 'https://cdn.ayahay.com/articles/manila-palawan-route.jpg',
          readMoreUrl: 'https://ayahay.com/news/manila-palawan-route',
          category: 'routes',
        },
        {
          title: 'Fleet Update: MV Ayahay Explorer Joins Our Family',
          summary:
            'Our newest vessel, MV Ayahay Explorer, features modern amenities including WiFi, premium cabins, and enhanced safety systems. Now serving the Cebu-Bohol route.',
          imageUrl: 'https://cdn.ayahay.com/vessels/ayahay-explorer.jpg',
          readMoreUrl: 'https://ayahay.com/fleet/ayahay-explorer',
          category: 'vessels',
        },
        {
          title: 'Island Hopping Guide: Must-Visit Spots in Visayas',
          summary:
            'Discover hidden gems and popular destinations across the Visayan islands. From pristine beaches to historic landmarks, plan your perfect island adventure.',
          imageUrl: 'https://cdn.ayahay.com/guides/visayas-hopping.jpg',
          readMoreUrl: 'https://ayahay.com/guides/visayas-island-hopping',
          category: 'travel-tips',
        },
      ],
      promotions: [
        {
          title: 'Early Bird Summer Sale',
          description:
            'Book your summer island getaway now and save 25% on all routes. Perfect for planning your vacation to Boracay, Palawan, or Bohol.',
          discountPercent: 25,
          validUntil: '2024-03-31',
          bookingUrl: 'https://app.ayahay.com/book?promo=SUMMER25',
          promoCode: 'SUMMER25',
        },
        {
          title: 'Student Discount Program',
          description:
            'Students get 15% off year-round with valid student ID. Making island travel more accessible for young explorers.',
          discountPercent: 15,
          validUntil: '2024-12-31',
          bookingUrl: 'https://app.ayahay.com/book?promo=STUDENT15',
          promoCode: 'STUDENT15',
        },
      ],
      operationalUpdates: [
        {
          title: 'Enhanced Safety Protocols',
          description:
            'New safety measures include updated life vests, improved emergency procedures, and enhanced crew training programs.',
          effectiveDate: '2024-02-01',
        },
        {
          title: 'Manila Terminal Improvements',
          description:
            'Our Manila terminal now features expanded waiting areas, improved food courts, and faster check-in processes.',
          effectiveDate: '2024-01-20',
          routes: ['Manila-Cebu', 'Manila-Palawan', 'Manila-Iloilo'],
        },
      ],
      brand: {
        apiBaseUrl: 'https://api.ayahay.com',
        logo: 'https://cdn.ayahay.com/logo-email.png',
        contact: {
          email: 'newsletter@ayahay.com',
          phone: '+63 (2) 8888-0000',
          website: 'https://ayahay.com',
        },
        companyName: 'Ayahay',
        colors: { primary: '#1E40AF', secondary: '#059669' },
        links: {
          website: 'https://ayahay.com',
          unsubscribe: 'https://app.ayahay.com/unsubscribe',
        },
      },
      unsubscribeUrl: 'https://app.ayahay.com/unsubscribe?token=xyz123',
      webViewUrl: 'https://app.ayahay.com/newsletter/2024-01',
    },
  },

  renderFunction: async (
    variables: NewsletterTemplateVariables,
  ): Promise<EmailTemplate> => {
    const emailHtml = await render(React.createElement(Newsletter, variables));

    const greeting = variables.customerName
      ? `Hello ${variables.customerName}!`
      : 'Hello!';

    return {
      subject: `${variables.newsletter.title} - ${variables.newsletter.edition}`,
      html: emailHtml,
      text: `${greeting}

${variables.newsletter.title} - ${variables.newsletter.edition}
${variables.newsletter.date}

${variables.newsletter.introduction}

${
  variables.articles?.length
    ? `
FEATURED ARTICLES:
${variables.articles
  .map(
    (article) => `
• ${article.title}
  ${article.summary}
  ${article.readMoreUrl ? `Read more: ${article.readMoreUrl}` : ''}
`,
  )
  .join('\n')}
`
    : ''
}

${
  variables.promotions?.length
    ? `
SPECIAL OFFERS:
${variables.promotions
  .map(
    (promo) => `
• ${promo.title}
  ${promo.description}
  ${promo.promoCode ? `Promo Code: ${promo.promoCode}` : ''}
  Valid until: ${promo.validUntil}
  ${promo.bookingUrl ? `Book now: ${promo.bookingUrl}` : ''}
`,
  )
  .join('\n')}
`
    : ''
}

${
  variables.operationalUpdates?.length
    ? `
OPERATIONAL UPDATES:
${variables.operationalUpdates
  .map(
    (update) => `
• ${update.title}
  ${update.description}
  ${update.effectiveDate ? `Effective: ${update.effectiveDate}` : ''}
  ${update.routes?.length ? `Routes: ${update.routes.join(', ')}` : ''}
`,
  )
  .join('\n')}
`
    : ''
}

---
${variables.brand.companyName}
${variables.brand.contact.email}
${variables.brand.contact.website || ''}

${variables.webViewUrl ? `View this newsletter online: ${variables.webViewUrl}` : ''}
${variables.unsubscribeUrl ? `Unsubscribe: ${variables.unsubscribeUrl}` : ''}`,
    };
  },
};
