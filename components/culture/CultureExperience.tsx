'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';
import { cultureChapters } from '@/lib/culture/chapters';
import { CultureArtwork } from './CultureArtwork';
import { CultureGallery } from './CultureGallery';
import { CultureThread, threadPath } from './CultureThread';
import styles from './culture.module.css';

const slideCount = cultureChapters.length + 2;
const autoplayDelay = 5500;

export function CultureExperience() {
  const root = useRef<HTMLElement>(null);
  const previousSlide = useRef(0);
  const pointerPlaybackIntent = useRef<boolean | null>(null);
  const reducedMotion = useReducedMotion();
  const [viewport, carousel] = useEmblaCarousel({ align: 'start', loop: false, duration: reducedMotion ? 0 : 16 });
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const alignStage = useCallback(() => {
    const element = root.current;
    if (!element) return;
    const offset = window.innerWidth > 900 ? 91 : 76;
    const distance = element.getBoundingClientRect().top - offset;
    if (Math.abs(distance) > 8) window.scrollTo({ top: window.scrollY + distance, behavior: 'instant' });
  }, []);

  const updateSelection = useCallback(() => {
    if (!carousel) return;
    const index = carousel.selectedScrollSnap();
    setActive(index);
    if (index === slideCount - 1) setPlaying(false);
  }, [carousel]);

  useEffect(() => {
    if (!carousel) return;
    const stop = () => setPlaying(false);
    carousel.on('select', updateSelection);
    carousel.on('reInit', updateSelection);
    carousel.on('pointerDown', stop);
    return () => {
      carousel.off('select', updateSelection);
      carousel.off('reInit', updateSelection);
      carousel.off('pointerDown', stop);
    };
  }, [carousel, updateSelection]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting));
    }, { threshold: .6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!carousel) return;
    let frame = 0;
    let cancelled = false;
    const followHash = () => {
      const chapter = cultureChapters.findIndex(item => window.location.hash === `#culture-${item.id}`);
      const target = chapter >= 0 ? chapter + 1 : window.location.hash === '#culture-finale' ? slideCount - 1 : -1;
      if (target < 0) return;
      carousel.scrollTo(target, true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(alignStage);
      void document.fonts.ready.then(() => { if (!cancelled) frame = requestAnimationFrame(() => { frame = requestAnimationFrame(alignStage); }); });
    };
    followHash();
    window.addEventListener('hashchange', followHash);
    window.addEventListener('popstate', followHash);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', followHash);
      window.removeEventListener('popstate', followHash);
    };
  }, [alignStage, carousel]);

  useEffect(() => {
    if (!carousel || !playing || !visible || hovered || reducedMotion || active === slideCount - 1) return;
    const timer = window.setTimeout(() => carousel.scrollNext(), autoplayDelay);
    return () => window.clearTimeout(timer);
  }, [active, carousel, hovered, playing, reducedMotion, visible]);

  useEffect(() => {
    const path = root.current?.querySelector<SVGPathElement>('[data-culture-thread] path');
    if (!path) return;
    const from = previousSlide.current;
    previousSlide.current = active;
    if (reducedMotion || from === active) {
      path.setAttribute('d', threadPath(active));
      return;
    }
    let frame = 0;
    const start = performance.now();
    const animate = (time: number) => {
      const progress = Math.min(1, (time - start) / 450);
      const eased = 1 - (1 - progress) ** 3;
      path.setAttribute('d', threadPath(from, active, eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active, reducedMotion]);

  const move = (direction: -1 | 1) => {
    if (!carousel) return;
    setPlaying(false);
    const next = Math.max(0, Math.min(slideCount - 1, carousel.selectedScrollSnap() + direction));
    setAnnouncement(`Story ${next + 1} of ${slideCount}: ${next === 0 ? 'Introduction' : next === slideCount - 1 ? 'Keep exploring' : cultureChapters[next - 1].name}`);
    carousel.scrollTo(next, !!reducedMotion);
    alignStage();
  };

  const chooseChapter = (index: number) => {
    setPlaying(false);
    setAnnouncement(`Story ${index + 2} of ${slideCount}: ${cultureChapters[index].name}`);
    carousel?.scrollTo(index + 1, !!reducedMotion);
    history.pushState(null, '', `#culture-${cultureChapters[index].id}`);
    alignStage();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
  };

  const isPlaying = playing && !reducedMotion;
  const autoAdvancing = isPlaying && visible && !hovered && active < slideCount - 1;

  return <section id="experiences" ref={root} className={styles.experience} data-active-chapter={active} data-theme={active > 0 && active < slideCount - 1 && cultureChapters[active - 1].theme === 'dark' ? 'dark' : 'light'} data-stage-active={visible} aria-labelledby="culture-title">
    <div className={styles.stage} data-culture-stage role="region" aria-roledescription="carousel" aria-label="Sri Lankan culture stories" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPlaying(false); }} onKeyDown={onKeyDown}>
      <CultureThread />
      <nav className={styles.navigation} aria-label="Choose a culture story">
        {cultureChapters.map((chapter, index) => <button key={chapter.id} type="button" aria-label={`${chapter.number} — ${chapter.keyword}: ${chapter.name}`} aria-current={active === index + 1 ? 'step' : undefined} onClick={() => chooseChapter(index)}><i aria-hidden="true" /></button>)}
      </nav>
      <div className={styles.viewport} ref={viewport} tabIndex={0} aria-label="Culture stories. Swipe or use the left and right arrow keys to explore.">
        <div className={styles.track}>
          <div className={`${styles.panel} ${styles.intro}`} id="culture-intro" role="group" aria-roledescription="slide" aria-label={`1 of ${slideCount}: Introduction`} aria-hidden={active !== 0} inert={active !== 0}>
            <div><h2 id="culture-title">AN ISLAND<br />YOU DON’T JUST SEE.<br /><em>YOU FEEL IT.</em></h2></div>
          </div>
          {cultureChapters.map((chapter, index) => <section key={chapter.id} id={`culture-${chapter.id}`} className={styles.panel} data-theme={chapter.theme} role="group" aria-roledescription="slide" aria-label={`${index + 2} of ${slideCount}: ${chapter.name}`} aria-hidden={active !== index + 1} inert={active !== index + 1} aria-labelledby={`culture-${chapter.id}-title`}>
            <div className={styles.copy}><h3 id={`culture-${chapter.id}-title`}>{chapter.title.map((line, i) => <span key={line} className={i === chapter.title.length - 1 ? styles.accent : undefined}>{line}</span>)}</h3><div className={styles.illustration}><CultureArtwork type={chapter.id} /></div></div>
            <div className={styles.artwork}><CultureGallery type={chapter.id} name={chapter.name} /></div>
          </section>)}
          <div id="culture-finale" className={`${styles.panel} ${styles.finale}`} role="group" aria-roledescription="slide" aria-label={`${slideCount} of ${slideCount}: Keep exploring`} aria-hidden={active !== slideCount - 1} inert={active !== slideCount - 1}><div><h3>NOT KEPT<br />BEHIND GLASS.<br /><em>STILL BEING LIVED.</em></h3><Link href="/memories" className={styles.cta}>Explore the stories <ArrowUpRight size={24} strokeWidth={1.5} /></Link></div></div>
        </div>
      </div>
      <div className={styles.controls}>
        <span className={styles.progress} aria-hidden="true"><span key={active} className={autoAdvancing ? styles.progressRunning : undefined} /></span>
        <div className={styles.actions}>
          <button type="button" aria-label={isPlaying ? 'Pause automatic stories' : 'Play automatic stories'} aria-pressed={isPlaying} onPointerDownCapture={() => { pointerPlaybackIntent.current = !isPlaying; }} onClick={event => { const next = event.detail > 0 && pointerPlaybackIntent.current !== null ? pointerPlaybackIntent.current : !isPlaying; pointerPlaybackIntent.current = null; setHovered(false); setPlaying(next); }} disabled={!!reducedMotion || active === slideCount - 1}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
          <button type="button" aria-label="Previous culture story" onClick={() => move(-1)} disabled={active === 0}><ArrowLeft size={20} /></button>
          <button type="button" aria-label="Next culture story" onClick={() => move(1)} disabled={active === slideCount - 1}><ArrowRight size={20} /></button>
        </div>
      </div>
      <span className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</span>
    </div>
  </section>;
}
