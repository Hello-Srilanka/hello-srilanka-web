import { useState } from 'react';
import Image from 'next/image';
import { cultureImages, cultureImageSrc } from '@/lib/culture/images';
import type { CultureArtworkType } from '@/lib/culture/chapters';
import styles from './culture.module.css';

export function CultureGallery({ type, name }: { type: CultureArtworkType; name: string }) {
  const images = cultureImages[type];
  const [selected, setSelected] = useState(0);

  return <div className={styles.gallery} data-culture-art={type} data-selected-photo={selected}>
    <div className={styles.galleryFrame}>
      <div id={`culture-photo-${type}`} className={styles.photo}>
        {images.map((photo, index) => <Image key={photo.file} src={cultureImageSrc(photo.file)} alt={index === selected ? photo.alt : ''} aria-hidden={index !== selected} fill unoptimized sizes="(max-width: 767px) 85vw, 40vw" className={index === selected ? styles.photoActive : styles.photoInactive} style={{ objectPosition: photo.position ?? 'center' }} />)}
      </div>
      {images.length > 1 && <div className={styles.thumbnails} role="group" aria-label={`${name} photographs`}>
        {images.map((photo, index) => <button key={photo.file} type="button" aria-label={`View photo ${index + 1}: ${photo.alt}`} aria-pressed={selected === index} aria-controls={`culture-photo-${type}`} onClick={() => setSelected(index)}>
          <Image src={cultureImageSrc(photo.file)} alt="" fill unoptimized sizes="70px" />
        </button>)}
      </div>}
    </div>
  </div>;
}
