import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
  appName: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({ name, appName, dashboardUrl }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Welcome to Ayahay - Your Logistics Solution!</Preview>
        <Container style={container}>
          <Section style={coverSection}>
            <Section style={headerSection}>
              <Img
                src="https://ayahay-v2-assets.s3.ap-southeast-2.amazonaws.com/whitelabel/1/logo/AYAHAY+SHIPPING+LINES.png"
                width="60"
                height="60"
                alt="Ayahay Logo"
                style={logoStyle}
              />
              <Text style={brandText}>Ayahay</Text>
            </Section>
            <Section style={upperSection}>
              <Heading style={h1}>Welcome to Ayahay!</Heading>
              <Text style={greetingText}>Hello {name},</Text>
              <Text style={mainText}>
                Welcome to Ayahay, the comprehensive logistics software designed specifically for shipping companies. 
                We're excited to have you join our platform and streamline your shipping operations!
              </Text>
              <Text style={mainText}>
                With Ayahay, you can efficiently manage your fleet, track shipments, optimize routes, 
                and enhance your overall logistics workflow. Our platform is built to handle the unique 
                challenges of the shipping industry.
              </Text>
              {dashboardUrl && (
                <Section style={buttonSection}>
                  <Link href={dashboardUrl} style={resetButton}>
                    Access Your Dashboard
                  </Link>
                </Section>
              )}
              <Text style={mainText}>
                Our support team is ready to help you get started with managing your shipping operations. 
                Don't hesitate to reach out if you need assistance setting up your fleet or configuring 
                your logistics workflows.
              </Text>
            </Section>
            <Hr style={hrStyle} />
            <Section style={lowerSection}>
              <Text style={cautionText}>
                Best regards,
                <br />
                The Ayahay Team
                <br />
                <em>Your Partner in Shipping Excellence</em>
              </Text>
            </Section>
          </Section>
          <Section style={socialSection}>
            <Text style={socialText}>Follow us on social media:</Text>
            <Section style={socialLinksSection}>
              <Link
                href="https://www.facebook.com/profile.php?id=61551614079847"
                target="_blank"
                style={socialLinkStyle}
              >
                <Img
                  src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
                  width="32"
                  height="32"
                  alt="Facebook"
                  style={socialIconStyle}
                />
              </Link>
              <Link href="mailto:admin@ayahay.com" style={socialLinkStyle}>
                <Img
                  src="https://cdn-icons-png.flaticon.com/512/732/732200.png"
                  width="32"
                  height="32"
                  alt="Email"
                  style={socialIconStyle}
                />
              </Link>
            </Section>
          </Section>
          <Text style={footerText}>
            This email was sent by Ayahay. © 2024, Ayahay. All
            rights reserved.
            <br />
            <Link
              href="https://ayahay.com/privacy"
              target="_blank"
              style={link}
            >
              Privacy Policy
            </Link>
            {' | '}
            <Link href="https://ayahay.com/terms" target="_blank" style={link}>
              Terms of Service
            </Link>
            <br />
            Contact us: <Link href="mailto:admin@ayahay.com" style={link}>admin@ayahay.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Ayahay Brand Colors
const AYAHAY_BLUE = '#24AAFF';
const AYAHAY_WHITE = '#FFFFFF';
const AYAHAY_DARK = '#1A1A1A';
const AYAHAY_LIGHT_GRAY = '#F8F9FA';
const AYAHAY_MEDIUM_GRAY = '#6C757D';

const fontFamily =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

const main = {
  backgroundColor: AYAHAY_LIGHT_GRAY,
  color: AYAHAY_DARK,
  fontFamily,
};

const container = {
  padding: '20px',
  margin: '0 auto',
  backgroundColor: AYAHAY_LIGHT_GRAY,
  maxWidth: '600px',
};

const coverSection = {
  backgroundColor: AYAHAY_WHITE,
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(36, 170, 255, 0.1)',
};

const headerSection = {
  backgroundColor: AYAHAY_WHITE,
  padding: '30px 20px',
  textAlign: 'center' as const,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '15px',
};

const logoStyle = {
  borderRadius: '8px',
};

const brandText = {
  color: 'black',
  fontFamily,
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const upperSection = {
  padding: '40px 35px 30px',
};

const h1 = {
  color: AYAHAY_DARK,
  fontFamily,
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '20px',
  textAlign: 'center' as const,
};

const greetingText = {
  color: AYAHAY_DARK,
  fontFamily,
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px 0',
};

const mainText = {
  color: AYAHAY_MEDIUM_GRAY,
  fontFamily,
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 20px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const resetButton = {
  backgroundColor: AYAHAY_BLUE,
  color: AYAHAY_WHITE,
  fontFamily,
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '0 auto',
  transition: 'background-color 0.2s ease',
};

const hrStyle = {
  borderColor: `${AYAHAY_BLUE}20`,
  margin: '0',
};

const lowerSection = {
  padding: '25px 35px 35px',
};

const cautionText = {
  color: AYAHAY_MEDIUM_GRAY,
  fontFamily,
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0',
  textAlign: 'center' as const,
  backgroundColor: `${AYAHAY_BLUE}05`,
  padding: '15px',
  borderRadius: '8px',
  border: `1px solid ${AYAHAY_BLUE}15`,
};

const socialSection = {
  backgroundColor: AYAHAY_LIGHT_GRAY,
  padding: '25px 35px',
  textAlign: 'center' as const,
  borderTop: `1px solid ${AYAHAY_BLUE}15`,
};

const socialText = {
  color: '#000000',
  fontFamily,
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 18px 0',
};

const socialLinksSection = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '20px',
};

const socialLinkStyle = {
  display: 'inline-block',
  padding: '8px',
  backgroundColor: AYAHAY_WHITE,
  borderRadius: '50%',
  textDecoration: 'none',
  border: `2px solid ${AYAHAY_BLUE}20`,
  transition: 'all 0.2s ease',
};

const socialIconStyle = {
  borderRadius: '0',
  display: 'block',
};

const footerText = {
  color: AYAHAY_MEDIUM_GRAY,
  fontFamily,
  fontSize: '12px',
  lineHeight: '1.4',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0',
};

const link = {
  color: AYAHAY_BLUE,
  fontFamily,
  textDecoration: 'none',
};

export default WelcomeEmail;