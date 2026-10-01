import Image from 'next/image';
import { ArrowUpRight, Download } from 'lucide-react';
import sampleImages from '@/public/images/planner-sample/manifest.json';
import styles from './personalization.module.css';

export function PersonalizationExperience() {
  const sample = sampleImages[0];
  return <div className={`section-space ${styles.section}`}>
    <div className={styles.intro}>
      <div className={`personalization-copy ${styles.copy}`}>
        <p className="eyebrow">INTRODUCING HELLOSRILANKA</p>
        <h2 className="display">NOT JUST<br />AN ITINERARY.<br /><span>YOUR ITINERARY.</span></h2>
        <p className={styles.description}>A glimpse of your journey, day by day.</p>
        <a className="text-link" href="/plan">Let’s make it yours <ArrowUpRight size={19} /></a>
      </div>
      <figure className={styles.preview} data-sample-itinerary="">
        <a className={styles.imageLink} href={sample.src} target="_blank" rel="noopener noreferrer" aria-label="Open the sample itinerary image at full size">
          <Image src={sample.src} alt="Sample seven-day Sri Lanka itinerary: Negombo, Sigiriya, Kandy, Ella and Galle, with daily highlights and overnight stops. Open full size to read." width={sample.width} height={sample.height} sizes="(max-width: 760px) 88vw, 440px" unoptimized />
        </a>
        <figcaption className={styles.caption}>
          <a href={sample.src} target="_blank" rel="noopener noreferrer">View full size <ArrowUpRight size={16} /></a>
          <a href={sample.src} download="HelloSriLanka-sample-itinerary.png" aria-label="Download sample itinerary image"><Download size={18} /></a>
        </figcaption>
      </figure>
    </div>
  </div>;
}