'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Pause, Play, ArrowUpRight, ArrowRight } from 'lucide-react';

const fullFilm = '/media/island-memories-1080p.mp4';
const poster = '/media/island-memories-poster.webp';

export default function MemoryFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showExplore, setShowExplore] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Metadata can fail before React hydrates the server-rendered video.
    // Reconcile that native state as well as listening for later failures.
    let active = true;
    const mediaError = () => { if (active) { setFailed(true); setPlaying(false); setShowExplore(true); } };
    video.addEventListener('error', mediaError);
    if (video.error) queueMicrotask(mediaError);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    let inView = false;
    let resume = false;
    let firstAppearance = true;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        resume = !video.paused;
        video.pause();
      } else {
        if (firstAppearance && (motion.matches || connection?.saveData) && video.paused) setShowExplore(true);
        const autoplay = firstAppearance && !motion.matches && !connection?.saveData;
        if (autoplay || resume) void video.play().catch(() => setShowExplore(true));
        firstAppearance = false;
        resume = false;
      }
    }, { threshold: 0.15 });
    const respectMotion = () => { if (motion.matches) { resume = false; video.pause(); setShowExplore(true); } };
    const visibility = () => {
      if (document.hidden) { resume = !video.paused; video.pause(); }
      else if (inView && resume) { resume = false; void video.play().catch(() => {}); }
    };
    observer.observe(video);
    motion.addEventListener('change', respectMotion);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      video.removeEventListener('error', mediaError);
      observer.disconnect();
      motion.removeEventListener('change', respectMotion);
      document.removeEventListener('visibilitychange', visibility);
      video.pause();
    };
  }, []);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 0.7;
    setMuted(video.muted || video.volume === 0);
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.ended || ended) video.currentTime = 0;
      setEnded(false);
      setClosing(false);
      setShowExplore(false);
      void video.play().catch(() => { setPlaying(false); setShowExplore(true); });
    }
    else video.pause();
  }

  return <>
    <div className="co-film-backdrop" aria-hidden="true" />
    {failed ? <Image className="co-film-poster" src={poster} alt="" fill sizes="100vw" unoptimized /> : <video
      id="memories-background-film"
      ref={videoRef}
      className={`co-film-video${closing ? ' is-closing' : ''}`}
      src={fullFilm}
      poster={poster}
      width={1920}
      height={1080}
      muted={muted}
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      onPlay={() => { setPlaying(true); setEnded(false); setShowExplore(false); }}
      onPause={() => setPlaying(false)}
      onTimeUpdate={event => setClosing(event.currentTarget.currentTime >= 33.6)}
      onEnded={() => { setPlaying(false); setEnded(true); setClosing(true); setShowExplore(true); }}
      onVolumeChange={event => setMuted(event.currentTarget.muted || event.currentTarget.volume === 0)}
      onError={() => { setFailed(true); setPlaying(false); setShowExplore(true); }}
    >
      <track kind="captions" src="/media/island-memories-en.vtt" srcLang="en" label="English" />
    </video>}
    <div className="co-film-shade" aria-hidden="true" />
    <a className={`co-memories-hero-action${showExplore ? ' is-visible' : ''}`} href="#community-feed" aria-hidden={!showExplore} tabIndex={showExplore ? 0 : -1}>Explore the memories <ArrowRight size={18} /></a>
    <noscript><a className="co-memories-hero-action is-visible" href="#community-feed">Explore the memories <ArrowRight size={18} /></a></noscript>
    <div className="co-film-controls" role="group" aria-label="Memories film controls">
      {!failed && <>
        <button type="button" aria-controls="memories-background-film" aria-label={playing ? 'Pause memories film' : ended ? 'Replay memories film' : 'Play memories film'} onClick={togglePlayback}>
          {playing ? <Pause size={16} /> : <Play size={16} />}<span>{playing ? 'Pause' : ended ? 'Replay' : 'Play'}</span>
        </button>
        <button type="button" aria-controls="memories-background-film" aria-label={muted ? 'Turn sound on' : 'Mute film'} aria-pressed={!muted} onClick={toggleSound}>
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}<span>{muted ? 'Sound off' : 'Sound on'}</span>
        </button>
      </>}
      <a href={fullFilm} target="_blank" rel="noopener noreferrer" aria-label="Open the full 1080p film in a new tab">Watch film <ArrowUpRight size={16} /></a>
    </div>
    <p className="co-visually-hidden">The Memories hero plays the complete forty-second film of Sri Lankan travel photographs with on-screen titles and instrumental music. Watch film opens it in a separate tab with browser playback controls.</p>
  </>;
}
