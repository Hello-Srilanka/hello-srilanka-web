import Image from 'next/image';
import { ArrowUpRight, X } from 'lucide-react';
import type { Destination } from '@/lib/experience-map/destinations';
import styles from './experience-map.module.css';

export function DestinationCard({ destination, close }: { destination: Destination; close: () => void }) {
  return <article className={styles.card} aria-labelledby="map-destination-name">
    {destination.image && <div className={styles.cardImage}><Image src={`/images/${destination.image}.webp`} alt="" fill sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 900px) 40vw, (min-width: 1600px) 440px, 400px" /></div>}
    <div className={styles.cardBody}>
      <button type="button" className={styles.close} onClick={close} aria-label="Close destination details"><X size={16} /></button>
      <p className={styles.region}>{destination.region}</p>
      <h3 id="map-destination-name">{destination.name}</h3>
      <p id="map-destination-description">{destination.description}</p>
      <span className={styles.tags}>{destination.tags}</span>
      <a href="#experiences">Explore experiences <ArrowUpRight size={16} /></a>
    </div>
  </article>;
}
