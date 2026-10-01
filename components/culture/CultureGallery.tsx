import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cultureImages, cultureImageSrc } from '@/lib/culture/images';
import type { CultureArtworkType } from '@/lib/culture/chapters';
import styles from './culture.module.css';

export function CultureGallery({ type, name }: { type: CultureArtworkType; name: string }) {
  const images = cultureImages[type];
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const gallery = root.current;
    if (!gallery) return;
    const change = (event: Event) => setSelected((event as CustomEvent<number>).detail);
    gallery.addEventListener('culture-photo-change', change);
    const mobile = window.matchMedia('(max-width: 767px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)');
    let cleanup: (() => void) | undefined;
    const setup = () => {
      cleanup?.();
      if (!mobile.matches || images.length < 2) return;
      gallery.dataset.galleryMotion = 'scroll';
      const frame = gallery.firstElementChild as HTMLElement;
      let raf = 0, near = false;
      const update = () => {
        raf = 0;
        const travel = gallery.offsetHeight - frame.offsetHeight;
        const progress = (140 - gallery.getBoundingClientRect().top) / Math.max(1, travel);
        setSelected(Math.max(0, Math.min(images.length - 1, Math.floor(progress * images.length))));
      };
      const schedule = () => { if (near && !raf) raf = requestAnimationFrame(update); };
      const resize = () => {
        gallery.style.minHeight = `${frame.offsetHeight + window.innerHeight * .55 * (images.length - 1)}px`;
        schedule();
      };
      resize();
      const observer = new IntersectionObserver(entries => {
        near = entries.some(entry => entry.isIntersecting);
        if (near) schedule();
      }, { rootMargin: '200px 0px' });
      observer.observe(gallery);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', resize);
      cleanup = () => {
        cancelAnimationFrame(raf); observer.disconnect();
        window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
        delete gallery.dataset.galleryMotion;
        gallery.style.removeProperty('min-height');
      };
    };
    setup(); mobile.addEventListener('change', setup);
    return () => { cleanup?.(); mobile.removeEventListener('change', setup); gallery.removeEventListener('culture-photo-change', change); };
  }, [images.length]);
  const choose = (index: number) => {
    setSelected(index);
    const gallery = root.current;
    if (!gallery) return;
    if (gallery.closest('[data-motion="pinned"]')) {
      gallery.dispatchEvent(new CustomEvent('culture-photo-seek', { bubbles: true, detail: { type, index } }));
    } else if (gallery.dataset.galleryMotion === 'scroll') {
      const frame = gallery.firstElementChild as HTMLElement;
      const travel = gallery.offsetHeight - frame.offsetHeight;
      window.scrollTo({ top: window.scrollY + gallery.getBoundingClientRect().top - 140 + travel * (index + .5) / images.length, behavior: 'instant' });
    }
  };
  return <div ref={root} className={styles.gallery} data-culture-art={type} data-selected-photo={selected}>
    <div className={styles.galleryFrame}>
      <div id={`culture-photo-${type}`} className={styles.photo}>
        {images.map((photo, index) => <Image key={photo.file} src={cultureImageSrc(photo.file)} alt={index === selected ? photo.alt : ''} aria-hidden={index !== selected} fill unoptimized sizes="(max-width: 767px) 85vw, 40vw" className={index === selected ? styles.photoActive : styles.photoInactive} style={{ objectPosition: photo.position ?? 'center' }} />)}
      </div>
      {images.length > 1 && <div className={styles.thumbnails} role="group" aria-label={`${name} photographs`}>
        {images.map((photo, index) => <button key={photo.file} type="button" aria-label={`View photo ${index + 1}: ${photo.alt}`} aria-pressed={selected === index} aria-controls={`culture-photo-${type}`} onClick={() => choose(index)}>
          <Image src={cultureImageSrc(photo.file)} alt="" fill unoptimized sizes="70px" />
        </button>)}
      </div>}
    </div>
  </div>;
}
