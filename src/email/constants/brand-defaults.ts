import { BrandContext } from '../types/brand.types';

/**
 * Default brand configuration for Ayahay
 * Used as fallback values when brand context is not provided or incomplete
 */
export const AYAHAY_BRAND_DEFAULTS: BrandContext = {
  apiBaseUrl: 'https://api.ayahay.com',
  logo: 'https://www.ayahay.com/assets/images/ayahay_logo_white.png',
  contact: {
    email: 'support@ayahay.com',
    phone: '+63 (2) 8888-0000',
    website: 'https://ayahay.com',
    address: 'Philippines',
  },
  companyName: 'Ayahay',
  brandName: 'Ayahay Maritime Solutions',
  colors: {
    primary: '#1E40AF',
    secondary: '#0EA5E9',
    background: '#F8FAFC',
  },
  links: {
    dashboard: 'https://app.ayahay.com',
    support: 'https://ayahay.com/support',
    website: 'https://ayahay.com',
    privacyPolicy: 'https://ayahay.com/privacy',
    termsOfService: 'https://ayahay.com/terms',
  },
  locale: 'en-PH',
  timezone: 'Asia/Manila',
};

/**
 * Create a safe brand context by merging provided brand with defaults
 * @param brand Partial brand context from API/user input
 * @returns Complete brand context with all required fields
 */
export function createSafeBrand(brand?: Partial<BrandContext>): BrandContext {
  return {
    apiBaseUrl: brand?.apiBaseUrl || AYAHAY_BRAND_DEFAULTS.apiBaseUrl,
    logo: brand?.logo || AYAHAY_BRAND_DEFAULTS.logo,
    contact: {
      email: brand?.contact?.email || AYAHAY_BRAND_DEFAULTS.contact.email,
      phone: brand?.contact?.phone || AYAHAY_BRAND_DEFAULTS.contact.phone,
      website: brand?.contact?.website || AYAHAY_BRAND_DEFAULTS.contact.website,
      address: brand?.contact?.address || AYAHAY_BRAND_DEFAULTS.contact.address,
      ...brand?.contact,
    },
    companyName: brand?.companyName || AYAHAY_BRAND_DEFAULTS.companyName,
    brandName: brand?.brandName || AYAHAY_BRAND_DEFAULTS.brandName,
    colors: brand?.colors
      ? {
          primary:
            brand.colors.primary || AYAHAY_BRAND_DEFAULTS.colors!.primary,
          secondary:
            brand.colors.secondary || AYAHAY_BRAND_DEFAULTS.colors!.secondary,
          background:
            brand.colors.background || AYAHAY_BRAND_DEFAULTS.colors!.background,
          ...brand.colors,
        }
      : AYAHAY_BRAND_DEFAULTS.colors,
    links: brand?.links
      ? {
          dashboard:
            brand.links.dashboard || AYAHAY_BRAND_DEFAULTS.links?.dashboard,
          support: brand.links.support || AYAHAY_BRAND_DEFAULTS.links?.support,
          website: brand.links.website || AYAHAY_BRAND_DEFAULTS.links?.website,
          privacyPolicy:
            brand.links.privacyPolicy ||
            AYAHAY_BRAND_DEFAULTS.links?.privacyPolicy,
          termsOfService:
            brand.links.termsOfService ||
            AYAHAY_BRAND_DEFAULTS.links?.termsOfService,
          ...brand.links,
        }
      : AYAHAY_BRAND_DEFAULTS.links,
    locale: brand?.locale || AYAHAY_BRAND_DEFAULTS.locale,
    timezone: brand?.timezone || AYAHAY_BRAND_DEFAULTS.timezone,
  };
}

/**
 * Common email template constants
 */
export const EMAIL_CONSTANTS = {
  DEFAULT_FONTS: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    monospace: 'Monaco, Consolas, "Lucida Console", monospace',
  },
  DEFAULT_COLORS: {
    text: {
      primary: '#374151',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
    border: '#E5E7EB',
    background: {
      light: '#F9FAFB',
      white: '#FFFFFF',
    },
  },
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
} as const;
