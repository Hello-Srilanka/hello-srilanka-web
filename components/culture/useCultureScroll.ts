import { useEffect, useRef, type RefObject } from 'react';
import { cultureChapters } from '@/lib/culture/chapters';
import { cultureBlend, cultureBoundaries, culturePhotoIndex, culturePhotoRanges, cultureScrollScreens, cultureStops } from '@/lib/culture/timeline';
import { threadPath } from './CultureThread';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => n * n * (3 - 2 * n);

export function useCultureScroll(root: RefObject<HTMLElement | null>) {
  const navigate = useRef<((index: number) => boolean) | null>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    let hashFrame = 0;
    const panels = [...element.querySelectorAll<HTMLElement>('[data-culture-panel]')];
    const links = [...element.querySelectorAll<HTMLAnchorElement>('[data-culture-nav]')];
    const mark = (active: number) => {
      element.dataset.activeChapter = String(active);
      links.forEach((link, i) => {
        if (i === active - 1) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    };
    // The static/mobile path also gets chapter tracking, without a GSAP timeline.
    const naturalObserver = new IntersectionObserver(entries => {
      if (element.dataset.motion === 'pinned') return;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const panel = entry.target as HTMLElement;
        mark(panels.indexOf(panel));
        if (!panel.dataset.revealed && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
          panel.dataset.revealed = 'true';
          panel.querySelector('[data-culture-art]')?.animate([{ opacity: .6, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'ease-out' });
        }
      });
    }, { rootMargin: '-25% 0px -45% 0px' });
    panels.forEach(panel => naturalObserver.observe(panel));

    const initialize = async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const match = gsap.matchMedia();
        match.add('(min-width: 768px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', () => {
          const stage = element.querySelector<HTMLElement>('[data-culture-stage]')!;
          const stageObserver = new IntersectionObserver(entries => {
            element.dataset.stageActive = String(entries.some(entry => entry.intersectionRatio >= .5));
          }, { threshold: .5 });
          stageObserver.observe(stage);
          const thread = element.querySelector<SVGPathElement>('[data-culture-thread] path')!;
          element.dataset.motion = 'pinned';
          let previous = -1;
          const galleries = panels.map(panel => panel.querySelector<HTMLElement>('[data-culture-art]'));
          const photoIndices = panels.map(() => -1);
          galleries.forEach((gallery, i) => {
            if (!gallery) return;
            gallery.dataset.photoStart = String(culturePhotoRanges[i - 1].start);
            gallery.dataset.photoEnd = String(culturePhotoRanges[i - 1].end);
          });
          const update = (progress: number) => {
            let from = 0, to = 0, blend = 0;
            cultureBoundaries.forEach((boundary, i) => {
              if (progress >= boundary - cultureBlend) {
                from = i; to = i + 1;
                blend = smooth(clamp((progress - boundary + cultureBlend) / (cultureBlend * 2)));
              }
            });
            const active = blend >= .5 ? to : from;
            element.dataset.cultureProgress = progress.toFixed(4);
            const night = (index: number) => index > 0 && index < 7 && cultureChapters[index - 1].theme === 'dark' ? 1 : 0;
            element.style.setProperty('--night', String(night(from) * (1 - blend) + night(to) * blend));
            thread.setAttribute('d', threadPath(from, to, blend));
            panels.forEach((panel, i) => {
              const opacity = from === to && i === from ? 1 : i === from ? 1 - blend : i === to ? blend : 0;
              panel.style.opacity = String(opacity);
              panel.style.visibility = opacity > .001 ? 'visible' : 'hidden';
              panel.style.transform = `translateY(${i === from ? -blend * 22 : i === to ? (1 - blend) * 26 : 0}px)`;
              if (opacity > 0) {
                const start = i === 0 ? 0 : cultureBoundaries[i - 1] - cultureBlend;
                const end = i === 7 ? 1 : cultureBoundaries[i] + cultureBlend;
                const local = clamp((progress - start) / (end - start));
                panel.style.setProperty('--local', String(local));
                const gallery = galleries[i];
                if (gallery) {
                  const photo = culturePhotoIndex(progress, i - 1);
                  if (photo !== photoIndices[i]) {
                    photoIndices[i] = photo;
                    gallery.dispatchEvent(new CustomEvent('culture-photo-change', { detail: photo }));
                  }
                }

              }
              if (previous !== active) {
                panel.inert = i !== active;
                panel.setAttribute('aria-hidden', String(i !== active));
              }
            });
            if (previous !== active) { mark(active); previous = active; }
          };
          const playhead = { progress: 0 };
          update(0);
          const tween = gsap.to(playhead, { progress: 1, ease: 'none', onUpdate: () => update(playhead.progress), scrollTrigger: {
            id: 'culture-thread', trigger: stage, pin: stage,
            start: () => `top ${window.innerWidth > 900 ? 91 : 76}px`,
            end: () => `+=${window.innerHeight * cultureScrollScreens}`,
            scrub: .35, anticipatePin: 1, invalidateOnRefresh: true,
            onRefresh: self => { element.dataset.scrollStart = String(self.start); element.dataset.scrollEnd = String(self.end); },
          } });
          navigate.current = (index: number) => {
            const trigger = tween.scrollTrigger;
            if (!trigger) return false;
            window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * cultureStops[index], behavior: 'instant' });
            trigger.update();
            tween.progress(cultureStops[index]);
            return true;
          };
          const seekPhoto = (event: Event) => {
            const request = event as CustomEvent<{ type: string; index: number }>;
            const chapter = cultureChapters.findIndex(chapter => chapter.id === request.detail.type);
            const trigger = tween.scrollTrigger;
            if (chapter < 0 || !trigger) return;
            const { start, end, count } = culturePhotoRanges[chapter];
            const progress = start + (end - start) * (request.detail.index + .5) / count;
            window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'instant' });
            trigger.update();
            tween.progress(progress);
          };
          element.addEventListener('culture-photo-seek', seekPhoto);
          const followHash = () => {
            const index = panels.findIndex(panel => `#${panel.id}` === window.location.hash);
            if (index >= 0) navigate.current?.(index);
          };
          window.addEventListener('hashchange', followHash);
          void document.fonts.ready.then(() => { if (!cancelled && element.dataset.motion === 'pinned') { ScrollTrigger.refresh(); followHash(); } });
          return () => {
            navigate.current = null;
            stageObserver.disconnect();
            element.removeEventListener('culture-photo-seek', seekPhoto);
            window.removeEventListener('hashchange', followHash);
            delete element.dataset.motion;
            delete element.dataset.stageActive;
            element.style.removeProperty('--night');
            panels.forEach(panel => { panel.removeAttribute('style'); panel.inert = false; panel.removeAttribute('aria-hidden'); });
          };
        });
        dispose = () => match.revert();
        // Upstream pinning changes document positions during hydration. Restore a
        // natural-layout deep link after fonts and those layout effects settle.
        void document.fonts.ready.then(() => {
          if (cancelled) return;
          hashFrame = requestAnimationFrame(() => {
            hashFrame = requestAnimationFrame(() => {
              if (cancelled || element.dataset.motion === 'pinned') return;
              const panel = panels.find(panel => `#${panel.id}` === window.location.hash);
              const nav = element.querySelector('nav');
              if (panel && nav) window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 900 ? 91 : 76) - nav.offsetHeight - 12, behavior: 'instant' });
            });
          });
        });
      } catch { /* The server-rendered, naturally flowing chapters stay available. */ }
    };
    const near = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { near.disconnect(); void initialize(); }
    }, { rootMargin: '1200px 0px' });
    if (panels.some(panel => `#${panel.id}` === window.location.hash)) {
      void initialize();
    } else near.observe(element);
    return () => { cancelled = true; cancelAnimationFrame(hashFrame); near.disconnect(); naturalObserver.disconnect(); dispose?.(); navigate.current = null; };
  }, [root]);
  return navigate;
}
