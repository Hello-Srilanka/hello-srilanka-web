import type { Metadata } from 'next';
import '@fontsource/anton/latin-400.css';
import '@fontsource-variable/dm-sans';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hellosrilanka.com'),
  title: 'HelloSriLanka | Personalized AI Travel Planner for Sri Lanka',
  description: 'Plan a Sri Lanka journey built around you. HelloSriLanka uses AI and Sri Lankan travel knowledge to personalize destinations, experiences and itineraries around the way you travel.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'en_US', siteName: 'HelloSriLanka', title: 'Find Your Sri Lanka. | HelloSriLanka', description: 'One island. A thousand ways to experience it. Your Sri Lanka. Your way.', url: '/' },
  twitter: { card: 'summary', title: 'Find Your Sri Lanka. | HelloSriLanka', description: 'Your Sri Lanka. Your way.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
