import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
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
      <Preview>Welcome to Ayahay - Your Logistics Solution!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://yourdomain.com/static/images/logo.png"
            alt="Ayahay Logo"
            style={logo}
          />
          <Heading style={h1}>Welcome to Ayahay!</Heading>
          <Text style={text}>Hello {name},</Text>
          <Text style={text}>
            Welcome to Ayahay, the comprehensive logistics software designed specifically for shipping companies. 
            We're excited to have you join our platform and streamline your shipping operations!
          </Text>
          <Text style={text}>
            With Ayahay, you can efficiently manage your fleet, track shipments, optimize routes, 
            and enhance your overall logistics workflow. Our platform is built to handle the unique 
            challenges of the shipping industry.
          </Text>
          {dashboardUrl && (
            <Text style={text}>
              <Link href={dashboardUrl} style={link}>
                Access your logistics dashboard
              </Link>
            </Text>
          )}
          <Text style={text}>
            Our support team is ready to help you get started with managing your shipping operations. 
            Don't hesitate to reach out if you need assistance setting up your fleet or configuring 
            your logistics workflows.
          </Text>
          <Text style={text}>
            Best regards,
            <br />
            The Ayahay Team
            <br />
            <em>Your Partner in Shipping Excellence</em>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  margin: '24px 0',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};

const logo = {
  margin: '0 auto 40px',
  display: 'block',
  maxWidth: '200px',
  height: 'auto',
};

export default WelcomeEmail;