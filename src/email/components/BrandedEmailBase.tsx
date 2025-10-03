import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BrandContext } from '../types/brand.types';

interface BrandedEmailBaseProps {
  brand: BrandContext;
  subject: string;
  previewText: string;
  children: React.ReactNode;
  showFooter?: boolean;
}

export const BrandedEmailBase = ({
  brand,
  subject,
  previewText,
  children,
  showFooter = true,
}: BrandedEmailBaseProps) => {
  const styles = getBrandStyles(brand);

  return (
    <Html>
      <Head>
        <title>{subject}</title>
      </Head>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Logo Header */}
          <div style={styles.header}>
            <Img
              src={brand.logo}
              alt={`${brand.companyName} Logo`}
              style={styles.logo}
            />
          </div>

          {/* Main Content */}
          <div style={styles.content}>{children}</div>

          {/* Footer */}
          {showFooter && (
            <div style={styles.footer}>
              <Text style={styles.footerText}>
                <strong>{brand.companyName}</strong>
                {brand.brandName && brand.brandName !== brand.companyName && (
                  <> - {brand.brandName}</>
                )}
              </Text>

              {brand.contact.address && (
                <Text style={styles.footerText}>{brand.contact.address}</Text>
              )}

              <div style={styles.footerLinks}>
                {brand.links?.website && (
                  <Link href={brand.links.website} style={styles.footerLink}>
                    Website
                  </Link>
                )}
                {brand.links?.support && (
                  <>
                    {brand.links.website && ' • '}
                    <Link href={brand.links.support} style={styles.footerLink}>
                      Support
                    </Link>
                  </>
                )}
                {brand.contact.email && (
                  <>
                    {(brand.links?.website || brand.links?.support) && ' • '}
                    <Link
                      href={`mailto:${brand.contact.email}`}
                      style={styles.footerLink}
                    >
                      Contact Us
                    </Link>
                  </>
                )}
              </div>

              {(brand.links?.privacyPolicy || brand.links?.termsOfService) && (
                <div style={{ ...styles.footerLinks, marginTop: '8px' }}>
                  {brand.links.privacyPolicy && (
                    <Link
                      href={brand.links.privacyPolicy}
                      style={styles.footerSmallLink}
                    >
                      Privacy Policy
                    </Link>
                  )}
                  {brand.links.termsOfService && (
                    <>
                      {brand.links.privacyPolicy && ' • '}
                      <Link
                        href={brand.links.termsOfService}
                        style={styles.footerSmallLink}
                      >
                        Terms of Service
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </Container>
      </Body>
    </Html>
  );
};

function getBrandStyles(brand: BrandContext) {
  const primaryColor = brand.colors?.primary || '#1E40AF';
  const backgroundColor = brand.colors?.background || '#F8FAFC';
  const textColor = '#374151';

  return {
    main: {
      backgroundColor,
      fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    },
    container: {
      backgroundColor: '#ffffff',
      margin: '0 auto',
      padding: '0',
      marginBottom: '64px',
      maxWidth: '580px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    header: {
      backgroundColor: primaryColor,
      padding: '32px 40px',
      textAlign: 'center' as const,
    },
    logo: {
      margin: '0 auto',
      display: 'block',
      maxWidth: '120px',
      height: 'auto',
    },
    content: {
      padding: '40px',
    },
    footer: {
      backgroundColor: '#F9FAFB',
      padding: '32px 40px',
      borderTop: '1px solid #E5E7EB',
      textAlign: 'center' as const,
    },
    footerText: {
      color: '#6B7280',
      fontSize: '14px',
      margin: '4px 0',
      textAlign: 'center' as const,
    },
    footerLinks: {
      marginTop: '16px',
      textAlign: 'center' as const,
    },
    footerLink: {
      color: primaryColor,
      fontSize: '14px',
      textDecoration: 'none',
    },
    footerSmallLink: {
      color: '#9CA3AF',
      fontSize: '12px',
      textDecoration: 'none',
    },
  };
}

// Branded text components
interface BrandedTextProps {
  brand: BrandContext;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface BrandedHeadingProps extends BrandedTextProps {
  level?: number;
}

export const BrandedHeading = ({ brand, children, style, level = 1 }: BrandedHeadingProps) => {
  const headingSizes: { [key: number]: string } = {
    1: '32px',
    2: '24px',
    3: '20px',
    4: '18px',
    5: '16px',
    6: '14px',
  };

  const fontSize = headingSizes[level] || headingSizes[1];

  return (
    <Heading
      style={{
        color: '#1F2937',
        fontSize,
        fontWeight: 'bold',
        margin: '0 0 24px 0',
        padding: '0',
        ...style,
      }}
    >
      {children}
    </Heading>
  );
};

export const BrandedText = ({ brand, children, style }: BrandedTextProps) => (
  <Text
    style={{
      color: '#374151',
      fontSize: '16px',
      lineHeight: '24px',
      margin: '16px 0',
      ...style,
    }}
  >
    {children}
  </Text>
);

export const BrandedLink = ({ brand, children, href, style }: BrandedTextProps & { href: string }) => (
  <Link
    href={href}
    style={{
      color: brand.colors?.primary || '#1E40AF',
      textDecoration: 'underline',
      ...style,
    }}
  >
    {children}
  </Link>
);

export const BrandedButton = ({
  brand,
  children,
  href,
  style,
  variant = 'primary',
}: BrandedTextProps & { href: string; variant?: string }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: brand.colors?.secondary || '#6B7280',
          color: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: brand.colors?.primary || '#1E40AF',
          border: `2px solid ${brand.colors?.primary || '#1E40AF'}`,
        };
      default: // primary
        return {
          backgroundColor: brand.colors?.primary || '#1E40AF',
          color: '#ffffff',
        };
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '32px 0' }}>
      <Link
        href={href}
        style={{
          ...getVariantStyles(),
          padding: '12px 24px',
          borderRadius: '6px',
          textDecoration: 'none',
          display: 'inline-block',
          fontWeight: '500',
          fontSize: '16px',
          ...style,
        }}
      >
        {children}
      </Link>
    </div>
  );
};