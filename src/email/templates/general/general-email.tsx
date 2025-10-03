import { Preview } from '@react-email/components';
import * as React from 'react';
import { BrandContext } from '../../types/brand.types';
import {
  BrandedEmailBase,
  BrandedText,
} from '../../components/BrandedEmailBase';
import { createSafeBrand } from '../../constants/brand-defaults';

interface GeneralEmailProps {
  brand?: BrandContext;
  subject: string;
  body: string;
}

export const GeneralEmail = ({
  brand,
  subject,
  body,
}: GeneralEmailProps) => {
  // Create safe brand context with defaults
  const safeBrand = createSafeBrand(brand);

  const previewText = subject || `Message from ${safeBrand.companyName}`;

  return (
    <>
      <Preview>{previewText}</Preview>
      <BrandedEmailBase
        brand={safeBrand}
        subject={subject}
        previewText={previewText}
      >
        <BrandedText
          brand={safeBrand}
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
          }}
        >
          {body}
        </BrandedText>
      </BrandedEmailBase>
    </>
  );
};

export default GeneralEmail;