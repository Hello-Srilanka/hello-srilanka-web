'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { media } from '@/lib/media';
export function HeroMedia() {
  const ref = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (query.matches || connection?.saveData || /2g/.test(connection?.effectiveType ?? '')) { setSource(null); setReady(false); return; }
      setSource(window.innerWidth < 768 ? media.heroVideo.mobile : media.heroVideo.desktop);
    };
    update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!source) return;
    const video = ref.current;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video?.pause(); else if (!paused) void video?.play().catch(() => setReady(false)); });
    if (video) observer.observe(video);
    return () => observer.disconnect();
  }, [source, paused]);
  return <><Image className="hero-photo" src={media.hero.src} alt={media.hero.alt} fill preload sizes="(max-width: 900px) 150vh, 100vw" />
    {source && <video ref={ref} className={`hero-video ${ready ? 'is-ready' : ''}`} src={source} poster={media.hero.src} autoPlay muted loop playsInline preload="none" onCanPlay={() => { void ref.current?.play().then(() => setReady(true)).catch(() => setReady(false)); }} onError={() => { setReady(false); setSource(null); }} aria-hidden="true" />}
    {source && ready && <button className="film-control" onClick={() => { if (paused) void ref.current?.play(); else ref.current?.pause(); setPaused(!paused); }} aria-label={paused ? 'Play background film' : 'Pause background film'}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
  </>;
}
