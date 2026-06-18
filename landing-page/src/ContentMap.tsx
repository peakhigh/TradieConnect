import React from 'react';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfUse from './components/TermsOfUse';
import ContactUs from '@/components/ContactUs';

interface ContentMapProps {
  [key: string]: React.ReactNode;
}

interface TitleMapProps {
  [key: string]: string;
}

export const TitleMap: TitleMapProps = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  about: 'About us',
  contact: 'Contact',
};

export const ContentMap: ContentMapProps = {
  privacy: <PrivacyPolicy />,
  terms: <TermsOfUse />,
  about: <>coming soon...</>,
  contact: <ContactUs />,
};

export function getContent(name: string): React.ReactNode {
  return ContentMap[name];
}

export function getTitle(name: string): string {
  return TitleMap[name];
}
