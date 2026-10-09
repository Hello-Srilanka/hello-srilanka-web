import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './coming-soon.module.css';

export const metadata: Metadata = {
  title: 'Coming Soon | HelloSriLanka',
  description: 'Something new is on its way from HelloSriLanka. Come back soon for more of the island.',
  alternates: { canonical: '/coming-soon' },
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.photo}>
        <Image
          src="/images/negombo-sunset.webp"
          alt="Sunset over the sea in Negombo, Sri Lanka"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 48vw"
        />
        <span className={styles.photoCaption}>NEGOMBO, SRI LANKA</span>
      </div>

      <div className={styles.content}>
        <header className={styles.header}>
          <span className="wordmark">hello<span>srilanka</span><span className="brand-period">.</span></span>
          <span className={styles.headerNote}>YOUR SRI LANKA. YOUR WAY.</span>
        </header>

        <section className={styles.message} aria-labelledby="coming-soon-title">
          <div className={styles.eyebrow}><span className={styles.dot} /> A NEW CHAPTER IS ON ITS WAY</div>
          <h1 id="coming-soon-title">COMING<br />SOON<span>.</span></h1>
          <p>There’s more of Sri Lanka to discover. We’re putting the finishing touches on something special. See you soon.</p>
        </section>

        <footer className={styles.footer}><span>AN ISLAND OF POSSIBILITIES</span><span>© {new Date().getFullYear()} HELLOSRILANKA</span></footer>
      </div>
    </main>
  );
}
