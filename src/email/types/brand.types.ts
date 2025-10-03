export interface BrandContext {
  apiBaseUrl: string;
  logo: string;
  contact: {
    email: string;
    phone?: string;
    address?: string;
    website?: string;
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
}

export type EmailBrandProps = BrandContext;

export interface BrandedEmailTemplate<T = Record<string, unknown>> {
  brand: BrandContext;
  variables: T;
}

// Helper type to make all brand props optional for backward compatibility
export type PartialBrandContext = Partial<BrandContext> & {
  apiBaseUrl: string;
  logo: string;
  contact: {
    email: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  companyName: string;
};
