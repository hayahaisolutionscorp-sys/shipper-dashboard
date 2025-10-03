import { Preview, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { RefundConfirmationTemplateVariables } from './refund-confirmation.definition';
import {
  BrandedEmailBase,
  BrandedHeading,
  BrandedText,
  BrandedLink,
  BrandedButton,
} from '../../components/BrandedEmailBase';
import { createSafeBrand } from '../../constants/brand-defaults';

export default function RefundConfirmation({
  customerName = 'Valued Customer',
  refund = {
    refundReference: 'REF-000000',
    originalBookingReference: 'BKG-000000',
    refundAmount: 0,
    currency: 'PHP',
    refundMethod: 'Original Payment Method',
    processingDays: 5,
    refundDate: new Date().toISOString(),
    reason: 'customer_request',
  },
  originalTrip = {
    route: {
      from: 'Origin',
      to: 'Destination',
    },
    departure: {
      date: new Date().toISOString().split('T')[0],
      time: '00:00',
    },
    vessel: 'Ferry',
  },
  brand,
  supportEmail,
  supportPhone,
}: RefundConfirmationTemplateVariables) {
  // Create safe brand context with defaults
  const safeBrand = createSafeBrand(brand);
  
  const route = `${originalTrip.route.from} to ${originalTrip.route.to}`;
  
  const reasonText = {
    customer_request: 'Customer Request',
    trip_cancellation: 'Trip Cancellation',
    schedule_change: 'Schedule Change',
    other: 'Other Reasons'
  }[refund.reason];

  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: refund.currency,
  }).format(refund.refundAmount);

  const subject = `Refund Confirmed - ${refund.refundReference}`;
  const previewText = `Your refund of ${formattedAmount} has been processed - ${refund.refundReference}`;

  return (
    <>
      <Preview>{previewText}</Preview>
      <BrandedEmailBase
        brand={safeBrand}
        subject={subject}
        previewText={previewText}
        showFooter={true}
      >
        <BrandedHeading brand={safeBrand} level={1}>
          Refund Confirmation
        </BrandedHeading>
        
        <BrandedText brand={safeBrand}>
          Hello {customerName},
        </BrandedText>
        
        <BrandedText brand={safeBrand}>
          Great news! Your refund has been processed successfully. The details are provided below:
        </BrandedText>

        <Section style={refundDetailsBox}>
          <BrandedHeading brand={safeBrand} level={2}>
            Refund Details
          </BrandedHeading>
          
          <table style={detailsTable}>
            <tr>
              <td style={labelCell}>Refund Reference:</td>
              <td style={valueCell}><strong>{refund.refundReference}</strong></td>
            </tr>
            <tr>
              <td style={labelCell}>Original Booking:</td>
              <td style={valueCell}>{refund.originalBookingReference}</td>
            </tr>
            <tr>
              <td style={labelCell}>Refund Amount:</td>
              <td style={{...valueCell, color: '#059669', fontWeight: 'bold', fontSize: '16px'}}>{formattedAmount}</td>
            </tr>
            <tr>
              <td style={labelCell}>Refund Method:</td>
              <td style={valueCell}>{refund.refundMethod}</td>
            </tr>
            <tr>
              <td style={labelCell}>Processing Date:</td>
              <td style={valueCell}>{new Date(refund.refundDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style={labelCell}>Expected in Account:</td>
              <td style={valueCell}>{refund.processingDays} business days</td>
            </tr>
            <tr>
              <td style={labelCell}>Reason:</td>
              <td style={valueCell}>{reasonText}</td>
            </tr>
          </table>
        </Section>

        <Section style={tripDetailsBox}>
          <BrandedHeading brand={safeBrand} level={2}>
            Original Trip Details
          </BrandedHeading>
          
          <table style={detailsTable}>
            <tr>
              <td style={labelCell}>Route:</td>
              <td style={valueCell}>{route}</td>
            </tr>
            <tr>
              <td style={labelCell}>Departure:</td>
              <td style={valueCell}>{originalTrip.departure.date} at {originalTrip.departure.time}</td>
            </tr>
            <tr>
              <td style={labelCell}>Vessel:</td>
              <td style={valueCell}>{originalTrip.vessel}</td>
            </tr>
          </table>
        </Section>

        <Section style={importantInfoBox}>
          <BrandedHeading brand={safeBrand} level={2}>
            Important Information
          </BrandedHeading>
          <BrandedText brand={safeBrand}>• Refunds are processed within {refund.processingDays} business days</BrandedText>
          <BrandedText brand={safeBrand}>• You will receive the refund via your original payment method</BrandedText>
          <BrandedText brand={safeBrand}>• Processing times may vary depending on your bank/card issuer</BrandedText>
          <BrandedText brand={safeBrand}>• Keep this confirmation for your records</BrandedText>
        </Section>

        <Hr style={hr} />

        <Section style={supportSection}>
          <BrandedText brand={safeBrand} style={{ fontWeight: 'bold' }}>
            Have questions about your refund?
          </BrandedText>
          <BrandedText brand={safeBrand}>
            Contact our support team:
          </BrandedText>
          <BrandedText brand={safeBrand}>
            📧 Email: <BrandedLink href={`mailto:${supportEmail || safeBrand.contact.email}`} brand={safeBrand}>
              {supportEmail || safeBrand.contact.email}
            </BrandedLink>
          </BrandedText>
          {(supportPhone || safeBrand.contact.phone) && (
            <BrandedText brand={safeBrand}>
              📞 Phone: {supportPhone || safeBrand.contact.phone}
            </BrandedText>
          )}
        </Section>

        <Hr style={hr} />

        <BrandedText brand={safeBrand} style={{ textAlign: 'center' }}>
          Thank you for choosing {safeBrand.companyName}. We look forward to serving you again!
        </BrandedText>

        {safeBrand.links?.website && (
          <BrandedText brand={safeBrand} style={{ textAlign: 'center' }}>
            <BrandedLink href={safeBrand.links.website} brand={safeBrand}>
              Visit our website
            </BrandedLink>
          </BrandedText>
        )}
      </BrandedEmailBase>
    </>
  );
}

// Styling for specific sections

const refundDetailsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
};

const tripDetailsBox = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
};

const importantInfoBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #fcd34d',
};

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  padding: '8px 12px 8px 0',
  fontSize: '14px',
  color: '#6b7280',
  verticalAlign: 'top' as const,
  width: '40%',
};

const valueCell = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#1f2937',
  verticalAlign: 'top' as const,
};

const supportSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  fontSize: '14px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};