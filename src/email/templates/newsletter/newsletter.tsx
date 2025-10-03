import { Preview, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { NewsletterTemplateVariables } from './newsletter.definition';
import {
  BrandedEmailBase,
  BrandedHeading,
  BrandedText,
  BrandedLink,
  BrandedButton,
} from '../../components/BrandedEmailBase';
import { createSafeBrand } from '../../constants/brand-defaults';

export default function Newsletter({
  customerName,
  newsletter = {
    title: 'Newsletter',
    edition: 'Latest Edition',
    date: new Date().toISOString().split('T')[0],
    introduction: 'Welcome to our newsletter with the latest updates and information.',
  },
  articles = [],
  promotions = [],
  operationalUpdates = [],
  brand,
  unsubscribeUrl,
  webViewUrl,
}: NewsletterTemplateVariables) {
  // Create safe brand context with defaults
  const safeBrand = createSafeBrand(brand);
  
  const greeting = customerName ? `Hello ${customerName}!` : 'Hello!';
  const previewText = `${newsletter.title} - ${newsletter.edition} | ${articles && articles.length > 0 ? articles[0].title : 'Latest updates'}`;

  const categoryColors = {
    routes: '#2563eb',
    vessels: '#059669',
    company: '#7c3aed',
    'travel-tips': '#ea580c',
    announcements: '#dc2626',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subject = `${newsletter.title} - ${newsletter.edition}`;

  return (
    <>
      <Preview>{previewText}</Preview>
      <BrandedEmailBase
        brand={safeBrand}
        subject={subject}
        previewText={previewText}
        showFooter={true}
      >
        {webViewUrl && (
          <Section style={webViewSection}>
            <BrandedText brand={safeBrand} style={webViewText}>
              Having trouble viewing this email? <BrandedLink href={webViewUrl} brand={safeBrand}>View in browser</BrandedLink>
            </BrandedText>
          </Section>
        )}

        <Section style={header}>
          <BrandedHeading brand={safeBrand} level={1} style={newsletterTitle}>
            {newsletter.title}
          </BrandedHeading>
          <BrandedText brand={safeBrand} style={newsletterSubtitle}>
            {newsletter.edition} • {formatDate(newsletter.date)}
          </BrandedText>
        </Section>

        {newsletter.featuredImage && (
          <Section style={featuredImageSection}>
            <img
              src={newsletter.featuredImage}
              width="568"
              height="300"
              alt="Newsletter Header"
              style={featuredImage}
            />
          </Section>
        )}

        <BrandedText brand={safeBrand} style={greetingStyle}>
          {greeting}
        </BrandedText>
        
        <BrandedText brand={safeBrand} style={introduction}>
          {newsletter.introduction}
        </BrandedText>

        <Hr style={sectionDivider} />

        {articles && articles.length > 0 && (
          <>
            <BrandedHeading brand={safeBrand} level={2}>
              📰 Featured Articles
            </BrandedHeading>
            
            {articles.map((article, index) => (
              <Section key={index} style={articleSection}>
                <div style={articleHeader}>
                  <span 
                    style={{
                      ...categoryBadge,
                      backgroundColor: categoryColors[article.category],
                    }}
                  >
                    {article.category.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                
                <BrandedHeading brand={safeBrand} level={3} style={articleTitle}>
                  {article.title}
                </BrandedHeading>
                
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    width="268"
                    height="150"
                    alt={article.title}
                    style={articleImage}
                  />
                )}
                
                <BrandedText brand={safeBrand} style={articleSummary}>
                  {article.summary}
                </BrandedText>
                
                {article.readMoreUrl && (
                  <BrandedButton
                    href={article.readMoreUrl}
                    brand={safeBrand}
                    variant="primary"
                    style={readMoreButton}
                  >
                    Read More
                  </BrandedButton>
                )}
              </Section>
            ))}
          </>
        )}

        {promotions && promotions.length > 0 && (
          <>
            <Hr style={sectionDivider} />
            <BrandedHeading brand={safeBrand} level={2}>
              🎉 Special Offers
            </BrandedHeading>
            
            {promotions.map((promo, index) => (
              <Section key={index} style={promoSection}>
                <BrandedHeading brand={safeBrand} level={3} style={promoTitle}>
                  {promo.title}
                </BrandedHeading>
                
                {promo.discountPercent && (
                  <div style={discountBadge}>
                    {promo.discountPercent}% OFF
                  </div>
                )}
                
                <BrandedText brand={safeBrand} style={promoDescription}>
                  {promo.description}
                </BrandedText>
                
                <div style={promoDetails}>
                  {promo.promoCode && (
                    <BrandedText brand={safeBrand} style={promoCode}>
                      <strong>Promo Code:</strong> {promo.promoCode}
                    </BrandedText>
                  )}
                  <BrandedText brand={safeBrand} style={promoValidity}>
                    <strong>Valid until:</strong> {formatDate(promo.validUntil)}
                  </BrandedText>
                </div>
                
                {promo.bookingUrl && (
                  <BrandedButton
                    href={promo.bookingUrl}
                    brand={safeBrand}
                    variant="secondary"
                    style={promoButton}
                  >
                    Book Now
                  </BrandedButton>
                )}
              </Section>
            ))}
          </>
        )}

        {operationalUpdates && operationalUpdates.length > 0 && (
          <>
            <Hr style={sectionDivider} />
            <BrandedHeading brand={safeBrand} level={2}>
              ⚙️ Service Updates
            </BrandedHeading>
            
            {operationalUpdates.map((update, index) => (
              <Section key={index} style={updateSection}>
                <BrandedHeading brand={safeBrand} level={3} style={updateTitle}>
                  {update.title}
                </BrandedHeading>
                <BrandedText brand={safeBrand} style={updateDescription}>
                  {update.description}
                </BrandedText>
                
                {update.effectiveDate && (
                  <BrandedText brand={safeBrand} style={updateDetails}>
                    <strong>Effective:</strong> {formatDate(update.effectiveDate)}
                  </BrandedText>
                )}
                
                {update.routes && update.routes.length > 0 && (
                  <BrandedText brand={safeBrand} style={updateDetails}>
                    <strong>Affected Routes:</strong> {update.routes.join(', ')}
                  </BrandedText>
                )}
              </Section>
            ))}
          </>
        )}

        <Hr style={sectionDivider} />

        <Section style={footer}>
          <BrandedText brand={safeBrand} style={footerText}>
            Thank you for sailing with {safeBrand.companyName}!
          </BrandedText>
          
          <BrandedText brand={safeBrand} style={footerText}>
            📧 {safeBrand.contact.email} | 📞 {safeBrand.contact.phone}
          </BrandedText>
          
          {safeBrand.contact.website && (
            <BrandedText brand={safeBrand} style={footerText}>
              🌐 <BrandedLink href={safeBrand.contact.website} brand={safeBrand}>
                {safeBrand.contact.website}
              </BrandedLink>
            </BrandedText>
          )}

          <Hr style={footerDivider} />
          
          <BrandedText brand={safeBrand} style={unsubscribeText}>
            You received this newsletter because you subscribed to {safeBrand.companyName} updates.
          </BrandedText>
          
          {unsubscribeUrl && (
            <BrandedText brand={safeBrand} style={unsubscribeText}>
              <BrandedLink href={unsubscribeUrl} brand={safeBrand} style={unsubscribeLink}>
                Unsubscribe from this newsletter
              </BrandedLink>
            </BrandedText>
          )}
        </Section>
      </BrandedEmailBase>
    </>
  );
}

// Styling for specific sections
const webViewSection = {
  backgroundColor: '#f3f4f6',
  padding: '8px 32px',
  textAlign: 'center' as const,
};

const webViewText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
};

const header = {
  backgroundColor: '#1e40af',
  padding: '32px',
  textAlign: 'center' as const,
  color: '#ffffff',
};

const newsletterTitle = {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  color: '#ffffff',
};

const newsletterSubtitle = {
  fontSize: '16px',
  margin: '0',
  color: '#e5e7eb',
};

const featuredImageSection = {
  padding: '0',
};

const featuredImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
};

const greetingStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 16px',
};

const introduction = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 24px',
};

const sectionDivider = {
  borderColor: '#e5e7eb',
  margin: '32px 0 24px',
};

const articleSection = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 20px',
  border: '1px solid #e5e7eb',
};

const articleHeader = {
  marginBottom: '12px',
};

const categoryBadge = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const articleTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 12px',
};

const articleImage = {
  width: '100%',
  height: 'auto',
  borderRadius: '6px',
  margin: '0 0 12px',
};

const articleSummary = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '0 0 16px',
};

const readMoreButton = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  border: 'none',
};

const promoSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 20px',
  border: '2px solid #fbbf24',
  position: 'relative' as const,
};

const promoTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 12px',
};

const discountBadge = {
  position: 'absolute' as const,
  top: '16px',
  right: '16px',
  backgroundColor: '#dc2626',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  padding: '6px 12px',
  borderRadius: '20px',
  transform: 'rotate(15deg)',
};

const promoDescription = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#78350f',
  margin: '0 0 12px',
};

const promoDetails = {
  marginBottom: '16px',
};

const promoCode = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0 0 4px',
  fontFamily: 'monospace',
  backgroundColor: '#ffffff',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
};

const promoValidity = {
  fontSize: '14px',
  color: '#78350f',
  margin: '0',
};

const promoButton = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
};

const updateSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 16px',
  border: '1px solid #bae6fd',
};

const updateTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#0c4a6e',
  margin: '0 0 8px',
};

const updateDescription = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#0369a1',
  margin: '0 0 8px',
};

const updateDetails = {
  fontSize: '12px',
  color: '#0369a1',
  margin: '0 0 4px',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px',
};

const footerDivider = {
  borderColor: '#e5e7eb',
  margin: '24px 0 16px',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 0 4px',
};

const unsubscribeLink = {
  color: '#6b7280',
  textDecoration: 'underline',
};