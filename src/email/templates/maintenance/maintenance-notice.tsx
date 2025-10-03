import { Preview, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { MaintenanceNoticeTemplateVariables } from './maintenance-notice.definition';
import {
  BrandedEmailBase,
  BrandedHeading,
  BrandedText,
  BrandedLink,
  BrandedButton,
} from '../../components/BrandedEmailBase';
import { createSafeBrand } from '../../constants/brand-defaults';

export default function MaintenanceNotice({
  customerName,
  maintenance = {
    type: 'scheduled',
    title: 'Scheduled Maintenance',
    description: 'We will be performing scheduled maintenance to improve our services.',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: '4 hours',
    reason: 'Routine maintenance and system upgrades',
    priority: 'medium',
  },
  affectedServices = {
    vessels: [],
    routes: [],
    terminals: [],
    systems: [],
  },
  alternatives,
  contact = {
    supportEmail: 'support@example.com',
  },
  brand,
  updateUrl,
}: MaintenanceNoticeTemplateVariables) {
  // Create safe brand context with defaults
  const safeBrand = createSafeBrand(brand);
  
  const greeting = customerName ? `Dear ${customerName}` : 'Dear Valued Customer';
  const previewText = `${maintenance.title} - ${maintenance.type.replace('_', ' ')} maintenance notice`;

  const priorityColors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };

  const priorityLabels = {
    low: 'MAINTENANCE NOTICE',
    medium: 'MAINTENANCE NOTICE',
    high: 'IMPORTANT MAINTENANCE',
    critical: 'URGENT MAINTENANCE NOTICE',
  };

  const impactColors = {
    cancelled: '#dc2626',
    delayed: '#f59e0b',
    rescheduled: '#3b82f6',
    alternative_vessel: '#059669',
  };

  const impactLabels = {
    cancelled: 'CANCELLED',
    delayed: 'DELAYED',
    rescheduled: 'RESCHEDULED',
    alternative_vessel: 'ALTERNATIVE VESSEL',
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const priorityText = {
    low: '',
    medium: '[MAINTENANCE NOTICE]',
    high: '[IMPORTANT MAINTENANCE]',
    critical: '[URGENT MAINTENANCE NOTICE]',
  }[maintenance.priority];

  const subject = `${priorityText} ${maintenance.title}`.trim();

  return (
    <>
      <Preview>{previewText}</Preview>
      <BrandedEmailBase
        brand={safeBrand}
        subject={subject}
        previewText={previewText}
        showFooter={true}
      >
        <Section style={alertBanner(priorityColors[maintenance.priority])}>
          <BrandedText brand={safeBrand} style={alertText}>
            {priorityLabels[maintenance.priority]}
          </BrandedText>
        </Section>

        <BrandedHeading brand={safeBrand} level={1}>
          {maintenance.title}
        </BrandedHeading>
        
        <BrandedText brand={safeBrand} style={{ fontWeight: 'bold' }}>
          {greeting},
        </BrandedText>
        
        <BrandedText brand={safeBrand}>
          We are writing to inform you about scheduled maintenance that may affect your travel plans. 
          Please review the details below and consider the alternative arrangements we have provided.
        </BrandedText>

        <Section style={maintenanceDetailsBox}>
          <BrandedHeading brand={safeBrand} level={2}>
            🔧 Maintenance Details
          </BrandedHeading>
          
          <BrandedText brand={safeBrand} style={description}>
            {maintenance.description}
          </BrandedText>
          
          <table style={detailsTable}>
            <tr>
              <td style={labelCell}>Type:</td>
              <td style={valueCell}>
                <span style={typeBadge(maintenance.type)}>
                  {maintenance.type.replace('_', ' ').toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style={labelCell}>Start Time:</td>
              <td style={valueCell}>{formatDateTime(maintenance.startDate)}</td>
            </tr>
            <tr>
              <td style={labelCell}>End Time:</td>
              <td style={valueCell}>{formatDateTime(maintenance.endDate)}</td>
            </tr>
            <tr>
              <td style={labelCell}>Duration:</td>
              <td style={valueCell}>{maintenance.estimatedDuration}</td>
            </tr>
            <tr>
              <td style={labelCell}>Reason:</td>
              <td style={valueCell}>{maintenance.reason}</td>
            </tr>
          </table>
        </Section>

        <Section style={affectedServicesBox}>
          <BrandedHeading brand={safeBrand} level={2}>
            ⚠️ Affected Services
          </BrandedHeading>
          
          {affectedServices.vessels && affectedServices.vessels.length > 0 && (
            <div style={serviceGroup}>
              <BrandedText brand={safeBrand} style={serviceLabel}>Vessels:</BrandedText>
              <BrandedText brand={safeBrand} style={serviceList}>{affectedServices.vessels.join(', ')}</BrandedText>
            </div>
          )}
          
          {affectedServices.routes && affectedServices.routes.length > 0 && (
            <div style={serviceGroup}>
              <BrandedText brand={safeBrand} style={serviceLabel}>Routes:</BrandedText>
              {affectedServices.routes.map((route, index) => (
                <div key={index} style={routeItem}>
                  <BrandedText brand={safeBrand} style={routeText}>
                    <strong>{route.from} → {route.to}</strong>
                  </BrandedText>
                  <span style={{
                    ...impactBadge,
                    backgroundColor: impactColors[route.impact],
                  }}>
                    {impactLabels[route.impact]}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {affectedServices.terminals && affectedServices.terminals.length > 0 && (
            <div style={serviceGroup}>
              <BrandedText brand={safeBrand} style={serviceLabel}>Terminals:</BrandedText>
              <BrandedText brand={safeBrand} style={serviceList}>{affectedServices.terminals.join(', ')}</BrandedText>
            </div>
          )}
          
          {affectedServices.systems && affectedServices.systems.length > 0 && (
            <div style={serviceGroup}>
              <BrandedText brand={safeBrand} style={serviceLabel}>Systems:</BrandedText>
              <BrandedText brand={safeBrand} style={serviceList}>{affectedServices.systems.join(', ')}</BrandedText>
            </div>
          )}
        </Section>

        {alternatives && (
          <>
            {alternatives.alternativeRoutes && alternatives.alternativeRoutes.length > 0 && (
              <Section style={alternativesBox}>
                <BrandedHeading brand={safeBrand} level={2}>
                  🚢 Alternative Arrangements
                </BrandedHeading>
                
                {alternatives.alternativeRoutes.map((route, index) => (
                  <div key={index} style={alternativeRoute}>
                    <BrandedText brand={safeBrand} style={alternativeRouteText}>
                      <strong>{route.from} → {route.to}</strong>
                    </BrandedText>
                    <BrandedText brand={safeBrand} style={alternativeDetails}>
                      Vessel: {route.vessel} | Departure: {route.departureTime}
                    </BrandedText>
                    {route.notes && (
                      <BrandedText brand={safeBrand} style={alternativeNotes}>{route.notes}</BrandedText>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {alternatives.rebookingInfo && (
              <Section style={optionsBox}>
                <BrandedHeading brand={safeBrand} level={2}>
                  📅 Rebooking Options
                </BrandedHeading>
                
                <BrandedText brand={safeBrand} style={optionItem}>
                  • {alternatives.rebookingInfo.automaticRebooking ? 
                    'Automatic rebooking to alternative arrangements' : 
                    'Manual rebooking required - contact customer service'}
                </BrandedText>
                
                <BrandedText brand={safeBrand} style={optionItem}>
                  • {alternatives.rebookingInfo.noChargeRebooking ? 
                    'No additional charges for rebooking' : 
                    'Rebooking fees may apply'}
                </BrandedText>
                
                <div style={actionButtons}>
                  {alternatives.rebookingInfo.rebookingUrl && (
                    <BrandedButton
                      href={alternatives.rebookingInfo.rebookingUrl}
                      brand={safeBrand}
                      variant="primary"
                    >
                      Rebook Online
                    </BrandedButton>
                  )}
                  
                  {alternatives.rebookingInfo.rebookingPhone && (
                    <BrandedText brand={safeBrand} style={phoneText}>
                      or call {alternatives.rebookingInfo.rebookingPhone}
                    </BrandedText>
                  )}
                </div>
              </Section>
            )}

            {alternatives.refundInfo && (
              <Section style={optionsBox}>
                <BrandedHeading brand={safeBrand} level={2}>
                  💰 Refund Options
                </BrandedHeading>
                
                <BrandedText brand={safeBrand} style={optionItem}>
                  • {alternatives.refundInfo.fullRefundAvailable ? 
                    'Full refund available for affected bookings' : 
                    'Partial refund available based on our refund policy'}
                </BrandedText>
                
                {alternatives.refundInfo.refundDeadline && (
                  <BrandedText brand={safeBrand} style={optionItem}>
                    • Refund request deadline: {new Date(alternatives.refundInfo.refundDeadline).toLocaleDateString()}
                  </BrandedText>
                )}
                
                {alternatives.refundInfo.refundUrl && (
                  <div style={actionButtons}>
                    <BrandedButton
                      href={alternatives.refundInfo.refundUrl}
                      brand={safeBrand}
                      variant="secondary"
                    >
                      Request Refund
                    </BrandedButton>
                  </div>
                )}
              </Section>
            )}
          </>
        )}

        <Hr style={hr} />

        <Section style={contactSection}>
          <BrandedHeading brand={safeBrand} level={2}>
            📞 Need Assistance?
          </BrandedHeading>
          
          <BrandedText brand={safeBrand}>
            Our customer service team is ready to help you with rebooking or any questions:
          </BrandedText>
          
          <div style={contactDetails}>
            <BrandedText brand={safeBrand} style={contactItem}>
              📧 <BrandedLink href={`mailto:${contact.supportEmail}`} brand={safeBrand}>
                {contact.supportEmail}
              </BrandedLink>
            </BrandedText>
            
            {contact.supportPhone && (
              <BrandedText brand={safeBrand} style={contactItem}>
                📞 {contact.supportPhone}
              </BrandedText>
            )}
            
            {contact.operationsEmail && (
              <BrandedText brand={safeBrand} style={contactItem}>
                ⚙️ Operations: <BrandedLink href={`mailto:${contact.operationsEmail}`} brand={safeBrand}>
                  {contact.operationsEmail}
                </BrandedLink>
              </BrandedText>
            )}
            
            {contact.emergencyPhone && (
              <BrandedText brand={safeBrand} style={contactItem}>
                🚨 Emergency: {contact.emergencyPhone}
              </BrandedText>
            )}
          </div>

          {updateUrl && (
            <div style={actionButtons}>
              <BrandedButton
                href={updateUrl}
                brand={safeBrand}
                variant="primary"
              >
                Live Maintenance Updates
              </BrandedButton>
            </div>
          )}
        </Section>

        <Hr style={hr} />

        <BrandedText brand={safeBrand} style={{ textAlign: 'center' }}>
          We sincerely apologize for any inconvenience this maintenance may cause. 
          These important improvements ensure we continue to provide you with safe, 
          reliable ferry services across the Philippines.
        </BrandedText>

        <BrandedText brand={safeBrand} style={{ textAlign: 'center' }}>
          Thank you for your understanding and continued trust in {safeBrand.companyName}.
        </BrandedText>
      </BrandedEmailBase>
    </>
  );
}

// Styling for specific sections
const alertBanner = (color: string) => ({
  backgroundColor: color,
  padding: '12px 32px',
  textAlign: 'center' as const,
});

const alertText = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const maintenanceDetailsBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #fcd34d',
};

const affectedServicesBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #fecaca',
};

const alternativesBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
};

const optionsBox = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #bae6fd',
};

const description = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#78350f',
  margin: '0 0 16px',
  fontStyle: 'italic',
};

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const labelCell = {
  padding: '8px 12px 8px 0',
  fontSize: '14px',
  color: '#78350f',
  verticalAlign: 'top' as const,
  width: '30%',
  fontWeight: 'bold',
};

const valueCell = {
  padding: '8px 0',
  fontSize: '14px',
  color: '#92400e',
  verticalAlign: 'top' as const,
};

const typeBadge = (type: string) => ({
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#ffffff',
  backgroundColor: type === 'emergency' ? '#dc2626' : type === 'scheduled' ? '#059669' : '#f59e0b',
  padding: '4px 8px',
  borderRadius: '12px',
  textTransform: 'uppercase' as const,
});

const serviceGroup = {
  marginBottom: '12px',
};

const serviceLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#991b1b',
  margin: '0 0 4px',
};

const serviceList = {
  fontSize: '14px',
  color: '#991b1b',
  margin: '0',
};

const routeItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid #fecaca',
};

const routeText = {
  fontSize: '14px',
  color: '#991b1b',
  margin: '0',
  flex: '1',
};

const impactBadge = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#ffffff',
  padding: '4px 8px',
  borderRadius: '12px',
  textTransform: 'uppercase' as const,
};

const alternativeRoute = {
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  padding: '12px',
  margin: '0 0 12px',
  border: '1px solid #d1fae5',
};

const alternativeRouteText = {
  fontSize: '14px',
  color: '#065f46',
  margin: '0 0 4px',
};

const alternativeDetails = {
  fontSize: '12px',
  color: '#047857',
  margin: '0 0 4px',
};

const alternativeNotes = {
  fontSize: '12px',
  color: '#047857',
  margin: '0',
  fontStyle: 'italic',
};

const optionItem = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#0c4a6e',
  margin: '0 0 8px',
};

const actionButtons = {
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const phoneText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '8px 0 0',
};

const contactSection = {
  textAlign: 'center' as const,
};

const contactDetails = {
  margin: '16px 0',
};

const contactItem = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 8px',
  display: 'block',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};