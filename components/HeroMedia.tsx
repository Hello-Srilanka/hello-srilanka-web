'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { media } from '@/lib/media';

type Variant = keyof typeof media.heroVideo;
type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

function HeroFilm({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const visible = useRef(true);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mp4Only, setMp4Only] = useState(false);
  const sources = media.heroVideo[variant];

  useEffect(() => {
    const video = ref.current;
    if (!video || failed) return;
    const syncPlayback = () => {
      if (manuallyPaused.current || !visible.current || document.hidden) video.pause();
      else void video.play().catch(() => setPlaying(false));
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
    video.addEventListener('canplay', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      observer.disconnect();
      video.removeEventListener('canplay', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [failed, mp4Only]);

  if (failed) return null;

  return <>
    <video
      key={mp4Only ? 'mp4' : 'webm'}
      ref={ref}
      className={`hero-video ${ready ? 'is-ready' : ''}`}
      width={variant === 'mobile' ? 720 : 1920}
      height={variant === 'mobile' ? 1280 : 1080}
      poster={variant === 'mobile' ? media.hero.mobile : media.hero.src}
      autoPlay muted loop playsInline preload="none" aria-hidden="true"
      onPlaying={() => { setReady(true); setPlaying(true); }}
      onPause={() => setPlaying(false)}
      onError={() => { setReady(false); if (!mp4Only) setMp4Only(true); else setFailed(true); }}
    >
      {!mp4Only && <source src={sources.webm} type="video/webm" onError={() => { setReady(false); setMp4Only(true); }} />}
      <source src={sources.mp4} type="video/mp4" onError={() => { setReady(false); setFailed(true); }} />
    </video>
    <button className="film-control" aria-label={playing ? 'Pause background film' : 'Play background film'} onClick={() => {
      const video = ref.current;
      if (!video) return;
      if (playing) { manuallyPaused.current = true; video.pause(); }
      else { manuallyPaused.current = false; void video.play().catch(() => setPlaying(false)); }
    }}>
      {playing ? <Pause size={15} /> : <Play size={15} />}
    </button>
  </>;
}

export function HeroMedia() {
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 767px)');
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const update = () => {
      const saveData = connection?.saveData || /2g/.test(connection?.effectiveType ?? '');
      setVariant(motion.matches || saveData ? null : mobile.matches ? 'mobile' : 'desktop');
    };
    update();
    motion.addEventListener('change', update);
    mobile.addEventListener('change', update);
    connection?.addEventListener('change', update);
    return () => {
      motion.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
    };
  }, []);

  return <>
    <picture>
      <source media="(max-width: 767px)" srcSet={media.hero.mobile} type="image/webp" />
      <Image className="hero-photo" src={media.hero.src} alt={media.hero.alt} fill loading="eager" fetchPriority="high" sizes="100vw" />
    </picture>
    {variant && <HeroFilm key={variant} variant={variant} />}
  </>;
}
