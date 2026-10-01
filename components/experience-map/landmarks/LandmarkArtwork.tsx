import { memo } from 'react';
import Image from 'next/image';
import type { LandmarkSpec } from '@/lib/experience-map/landmarks';
import styles from '../experience-map.module.css';

export const LandmarkArtwork = memo(function LandmarkArtwork({ artwork, scale }: { artwork: LandmarkSpec; scale: number }) {
  if (!artwork.image) return null;
  const filename = artwork.image.replace(/\.png$/i, '.webp');
  return <span className={styles.landmarkArtwork} aria-hidden="true">
    <Image
      src={`/images/map/thumbnails/${encodeURIComponent(filename)}`}
      alt="" fill unoptimized draggable={false}
      style={{ objectFit: 'contain', transform: `scale(${scale})` }}
    />
  </span>;
});
