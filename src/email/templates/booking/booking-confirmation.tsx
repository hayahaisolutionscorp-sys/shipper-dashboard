import { Preview, Section, Hr } from '@react-email/components';
import React from 'react';
import { BrandContext } from '../../types/brand.types';
import {
  BrandedEmailBase,
  BrandedHeading,
  BrandedText,
  BrandedLink,
  BrandedButton,
} from '../../components/BrandedEmailBase';
import { createSafeBrand } from '../../constants/brand-defaults';

interface PassengerInfo {
  name: string;
  type: 'Adult' | 'Child' | 'Infant' | 'Senior';
  discountType?: string;
}

interface BookingDetails {
  bookingReference: string;
  bookingDate: string;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
}

interface TripDetails {
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
}

interface BookingConfirmationProps {
  customerName: string;
  booking: BookingDetails;
  trip: TripDetails;
  passengers: PassengerInfo[];
  brand?: BrandContext;
  checkInUrl?: string;
  supportPhone?: string;
}

export default function BookingConfirmation({
  customerName,
  booking,
  trip,
  passengers,
  brand,
  checkInUrl,
  supportPhone,
}: BookingConfirmationProps) {
  // Create safe brand context with defaults
  const safeBrand = createSafeBrand(brand);

  const subject = `Booking Confirmed - ${booking.bookingReference}`;
  const previewText = `Your ferry booking from ${trip.route.from} to ${trip.route.to} is confirmed!`;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} at ${time}`;
  };

  return (
    <>
      <Preview>{previewText}</Preview>
      <BrandedEmailBase
        brand={safeBrand}
        subject={subject}
        previewText={previewText}
        showFooter={true}
      >
        <BrandedHeading brand={safeBrand}>Booking Confirmed!</BrandedHeading>

        <BrandedText brand={safeBrand}>
          Hello {customerName},
        </BrandedText>

        <BrandedText brand={safeBrand}>
          Your booking has been confirmed.
        </BrandedText>
        
        <BrandedText brand={safeBrand}>
          Please review your payment details below.
        </BrandedText>
        
        <BrandedText brand={safeBrand} style={{ fontWeight: 'bold' }}>
          Please see attached itinerary receipt and make sure to PRINT it.
        </BrandedText>

        {/* Booking Reference Section */}
        <Section style={compactBookingReferenceSection(safeBrand)}>
          <BrandedText
            brand={safeBrand}
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#6B7280',
              margin: '0 0 4px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            Booking Reference
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: safeBrand.colors?.primary || '#1E40AF',
              fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
              letterSpacing: '1px',
              margin: '0',
              wordBreak: 'break-all' as const,
              overflowWrap: 'break-word' as const,
            }}
          >
            {booking.bookingReference}
          </BrandedText>
        </Section>

        {/* Trip Details */}
        <BrandedText
          brand={safeBrand}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#374151',
          }}
        >
          TRIP DETAILS
        </BrandedText>

        <Section style={compactDetailsSection}>
          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Route :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.route.from} to {trip.route.to}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Departure :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {formatDateTime(trip.departure.date, trip.departure.time)}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              From :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.departure.terminal}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Arrival :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {formatDateTime(trip.arrival.date, trip.arrival.time)}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              To :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.arrival.terminal}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Vessel :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.vessel}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Class :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.seatClass}
            </BrandedText>
          </div>

          <div style={tripRow}>
            <BrandedText brand={safeBrand} style={tripLabelStyle}>
              Duration :
            </BrandedText>
            <BrandedText brand={safeBrand} style={tripValueStyle}>
              {trip.duration}
            </BrandedText>
          </div>
        </Section>

        {/* Passenger Information */}
        <BrandedText
          brand={safeBrand}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#374151',
          }}
        >
          PASSENGERS ({passengers.length})
        </BrandedText>

        <Section style={compactDetailsSection}>
          {passengers.map((passenger, index) => (
            <div key={index} style={compactPassengerRow}>
              <BrandedText
                brand={safeBrand}
                style={{ fontSize: '12px', fontWeight: '400', margin: '0' }}
              >
                {passenger.name} ({passenger.type}{passenger.discountType && `, ${passenger.discountType}`})
              </BrandedText>
            </div>
          ))}
        </Section>

        {/* Payment Information */}
        <BrandedText
          brand={safeBrand}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#374151',
          }}
        >
          PAYMENT DETAILS
        </BrandedText>

        <Section style={compactDetailsSection}>
          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={paymentLabelStyle}>
              Booking Date :
            </BrandedText>
            <BrandedText brand={safeBrand} style={paymentValueStyle}>
              {new Date(booking.bookingDate).toLocaleDateString('en-PH', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric',
              })} {new Date(booking.bookingDate).toLocaleTimeString('en-PH', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </BrandedText>
          </div>

          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={paymentLabelStyle}>
              Booking Reference :
            </BrandedText>
            <BrandedText brand={safeBrand} style={paymentValueStyle}>
              {booking.bookingReference}
            </BrandedText>
          </div>

          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={paymentLabelStyle}>
              Payment Type :
            </BrandedText>
            <BrandedText brand={safeBrand} style={paymentValueStyle}>
              {booking.paymentMethod}
            </BrandedText>
          </div>

          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={paymentLabelStyle}>
              Ticket Amount :
            </BrandedText>
            <BrandedText brand={safeBrand} style={paymentValueStyle}>
              {formatCurrency(booking.totalAmount * 0.9, booking.currency)}
            </BrandedText>
          </div>

          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={paymentLabelStyle}>
              Service Fee : Non-refundable
            </BrandedText>
            <BrandedText brand={safeBrand} style={paymentValueStyle}>
              {formatCurrency(booking.totalAmount * 0.1, booking.currency)}
            </BrandedText>
          </div>

          <Hr style={{ borderColor: '#374151', margin: '16px 0' }} />

          <div style={paymentRow}>
            <BrandedText brand={safeBrand} style={{
              ...paymentLabelStyle,
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              TOTAL :
            </BrandedText>
            <BrandedText
              brand={safeBrand}
              style={{
                ...paymentValueStyle,
                fontSize: '16px',
                fontWeight: 'bold',
                color: safeBrand.colors?.primary || '#1E40AF',
              }}
            >
              {formatCurrency(booking.totalAmount, booking.currency)}
            </BrandedText>
          </div>
        </Section>

        {/* Important Notes */}
        <Hr style={{ borderColor: '#E5E7EB', margin: '16px 0' }} />

        <BrandedText
          brand={safeBrand}
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#374151',
          }}
        >
          REMINDERS
        </BrandedText>

        <Section style={remindersSection}>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Please make sure to print the e-ticket.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Please note of the reminders specified on the e-tickets.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Boarding gates may be closed 30 minutes before departure time. Those who cannot check in 30 minutes before departure may be refused boarding.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Passengers are advised to be at the terminal at least 1-2 hours before the indicated departure time to avoid inconvenience.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Passengers listed on this itinerary should present valid IDs with their names on it. Failure to do so may result in refusal of boarding.
          </BrandedText>
          
          <BrandedText
            brand={safeBrand}
            style={{
              ...reminderItemStyle,
              marginLeft: '20px',
              fontWeight: '500',
            }}
          >
            List of Valid IDs:
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={{ ...reminderItemStyle, marginLeft: '40px' }}
          >
            • Government issued IDs (SSS, GSIS, Voter's, Postal, Driver's license, PRC, etc)
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={{ ...reminderItemStyle, marginLeft: '40px' }}
          >
            • OSCA ID (This ID is required when you have availed of the senior citizen discount.)
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={{ ...reminderItemStyle, marginLeft: '40px' }}
          >
            • Company ID or Student ID (must have the signature/stamp for the current school term.)
          </BrandedText>
          
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Please proceed to the shipping company's ticket outlet for refunds or rescheduling. Service Fee is non-refundable.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • Sailing schedule of the vessel may be changed or cancelled without prior notice.
          </BrandedText>
          <BrandedText
            brand={safeBrand}
            style={reminderItemStyle}
          >
            • This ticket is subject to the terms and conditions stated on the {safeBrand.companyName} website, and is also subject to the terms and conditions of the shipping company.
          </BrandedText>
        </Section>

        <BrandedText
          brand={safeBrand}
          style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '11px',
            fontStyle: 'italic',
            margin: '12px 0',
          }}
        >
          If you need to make changes, please contact us before departure.
        </BrandedText>

        {/* Contact Information */}
        <BrandedText
          brand={safeBrand}
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          Thank you.
          <br />
          {safeBrand.companyName} Support
        </BrandedText>

        <BrandedText
          brand={safeBrand}
          style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '11px',
            color: '#6B7280',
            fontStyle: 'italic',
          }}
        >
          This is an auto-generated email.
        </BrandedText>

        <BrandedText
          brand={safeBrand}
          style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '10px',
            color: '#6B7280',
            lineHeight: '1.4',
            wordBreak: 'break-word' as const,
            paddingLeft: '8px',
            paddingRight: '8px',
          }}
        >
          Please do not reply to this e-mail. Should you wish to contact us, please check out our contact us page on our website and we will get back to you.
        </BrandedText>
      </BrandedEmailBase>
    </>
  );
}

// Preview props for development
BookingConfirmation.PreviewProps = {
  customerName: 'Juan Dela Cruz',
  booking: {
    bookingReference: 'AYH-2024-001234',
    bookingDate: '2024-01-15T10:30:00Z',
    totalAmount: 2850.00,
    currency: 'PHP',
    paymentMethod: 'Credit Card (****1234)',
    paymentStatus: 'Paid',
  },
  trip: {
    route: {
      from: 'Manila',
      to: 'Cebu',
    },
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
    { name: 'Jose Dela Cruz', type: 'Child', discountType: 'Student Discount' },
  ],
  checkInUrl: 'https://app.ayahay.com/check-in?ref=AYH-2024-001234',
  supportPhone: '+63 (2) 8888-0000',
  brand: {
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
  },
} satisfies BookingConfirmationProps;

// Style constants
function compactBookingReferenceSection(brand: BrandContext) {
  return {
    backgroundColor: '#F9FAFB',
    borderRadius: '6px',
    padding: '12px 8px',
    textAlign: 'center' as const,
    margin: '12px 0',
    border: `1px solid ${brand.colors?.primary || '#1E40AF'}30`,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  };
}

const compactDetailsSection = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  padding: '12px 8px',
  margin: '8px 0',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box' as const,
};

const tripRow = {
  display: 'block',
  margin: '8px 0',
  paddingLeft: '8px',
};

const tripLabelStyle = {
  fontSize: '12px',
  color: '#374151',
  margin: '0 0 2px 0',
  fontWeight: '500',
  display: 'block',
};

const tripValueStyle = {
  fontSize: '12px',
  fontWeight: '400',
  margin: '0 0 4px 0',
  display: 'block',
  paddingLeft: '12px',
};

const compactPassengerRow = {
  margin: '6px 0',
  paddingLeft: '8px',
  wordBreak: 'break-word' as const,
};

const paymentRow = {
  display: 'block',
  margin: '8px 0',
  paddingLeft: '8px',
};

const paymentLabelStyle = {
  fontSize: '12px',
  color: '#374151',
  margin: '0 0 2px 0',
  fontWeight: '500',
  display: 'block',
};

const paymentValueStyle = {
  fontSize: '12px',
  fontWeight: '400',
  margin: '0 0 4px 0',
  display: 'block',
  paddingLeft: '12px',
};

const remindersSection = {
  margin: '8px 0',
};

const reminderItemStyle = {
  fontSize: '12px',
  margin: '6px 0',
  lineHeight: '1.5',
  color: '#374151',
  wordBreak: 'break-word' as const,
  paddingRight: '8px',
};