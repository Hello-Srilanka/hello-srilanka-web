import type { Metadata } from 'next';
import { Sun } from 'lucide-react';
import { HeroMedia } from '@/components/HeroMedia';
import styles from './coming-soon.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hellosrilanka.lk'),
  title: 'Coming Soon | HelloSriLanka',
  description: 'An AI travel planner creating personalized, day-by-day Sri Lanka itineraries around your interests, dates and pace. HelloSriLanka is coming soon.',
  alternates: { canonical: '/coming-soon' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Coming Soon | HelloSriLanka',
    description: 'An AI travel planner creating personalized, day-by-day Sri Lanka itineraries around your interests, dates and pace. Coming soon.',
    url: '/coming-soon',
    images: [{ url: '/images/hero-film-1200.webp', width: 1200, height: 675, alt: 'The green mountain ridges of Sri Lanka' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coming Soon | HelloSriLanka',
    description: 'An AI travel planner creating personalized, day-by-day Sri Lanka itineraries around your interests, dates and pace. Coming soon.',
    images: ['/images/hero-film-1200.webp'],
  },
};

export default function ComingSoonPage() {
  return (
    <main id="main" className={styles.page}>
      <HeroMedia />
      <div className={styles.shade} aria-hidden="true" />

      <header className={styles.header}>
        <span className="wordmark" aria-label="HelloSriLanka">hello<span>srilanka</span><span className="brand-period">.</span></span>
        <span className={styles.headerNote}><Sun size={22} strokeWidth={1.3} aria-hidden="true" /> AN ISLAND OF POSSIBILITIES</span>
      </header>

      <section className={styles.message} aria-labelledby="coming-soon-title">
        <p className={styles.eyebrow}><span className={styles.dot} aria-hidden="true" /> COMING SOON</p>
        <h1 id="coming-soon-title">YOUR SRI LANKA.<br /><span>PLANNED FOR YOU.</span></h1>
        <p className={styles.description}>An AI travel planner that turns your interests, dates and pace into a personal Sri Lanka itinerary.</p>
        <ul className={styles.features} aria-label="What HelloSriLanka offers">
          <li>
            <h2>Made for you</h2>
            <p>Your interests. Your pace. Your style.</p>
          </li>
          <li>
            <h2>Planned day by day</h2>
            <p>A clear itinerary for every day.</p>
          </li>
          <li>
            <h2>Discover Sri Lanka</h2>
            <p>Places, local experiences and suggested stays.</p>
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <span>YOUR SRI LANKA. YOUR WAY.</span>
        <span className={styles.location}>SRI LANKA <span aria-hidden="true">/</span> INDIAN OCEAN</span>
        <span className={styles.copyright}>© {new Date().getFullYear()} HELLOSRILANKA</span>
      </footer>
    </main>
  );
}
