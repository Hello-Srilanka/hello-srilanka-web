'use client';
import { useEffect, type RefObject } from 'react';
import { plannedStops } from '@/lib/find-yours/journey';
import { buildMemoryTimeline } from '@/components/memory-transition/motion';

export function useFindYoursScroll(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const element = root.current;
      const media = gsap.matchMedia();
      media.add('(min-width: 768px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', () => {
        const stage = element.querySelector<HTMLElement>('[data-find-stage]')!;
        const planner = element.querySelector<HTMLElement>('[data-live-planner]')!;
        const intro = element.querySelector<HTMLElement>('[data-question]')!;
        const scene = element.querySelector<SVGSVGElement>('[data-animated-scene] svg')!;
        const q = gsap.utils.selector(scene);
        const memoryRoot = element.querySelector<HTMLElement>('[data-memory-transition]');
        const memories = memoryRoot ? buildMemoryTimeline(gsap, memoryRoot) : undefined;
        element.dataset.enhanced = 'true';
        planner.inert = true;
        planner.setAttribute('aria-hidden', 'true');
        gsap.set(planner, { autoAlpha: 0, scale: .56, x: -60, y: 15, transformOrigin: '53% 46vh' });
        gsap.set(scene, { autoAlpha: 0 });
        gsap.set(q('[data-arrival-objects]'), { x: 155, y: -110, autoAlpha: 0 });
        gsap.set(q('[data-budget]'), { attr: { width: 162 } });
        gsap.set(q('[data-vehicle]'), { autoAlpha: 0 });
        const route = scene.querySelector<SVGPathElement>('[data-mess-route]')!;
        const vehicle = scene.querySelector<SVGGElement>('[data-vehicle]')!;
        const travel = { distance: 0 };
        const routeLength = route.getTotalLength();
        const mess = gsap.timeline({ paused: true });
        mess.to(q('[data-mess-pin]'), { opacity: 1, duration: .12, stagger: .095 }, 0)
          .to(route, { strokeDashoffset: 0, duration: .9, ease: 'none' }, .1)
          .to(q('[data-vehicle]'), { autoAlpha: 1, duration: .05 }, .08)
          .to(travel, { distance: 1, duration: .9, ease: 'none', onUpdate: () => {
            const point = route.getPointAtLength(travel.distance * routeLength);
            vehicle.setAttribute('transform', `translate(${point.x} ${point.y})`);
          } }, .1)
          .to(q('[data-pulse]'), { scale: 1.7, transformOrigin: '50% 50%', opacity: .12, duration: .18, stagger: .1 }, .03)
          .to(q('[data-day]').slice(0, 6), { opacity: .12, duration: .12, stagger: .1 }, .22)
          .to(q('[data-budget]'), { attr: { width: 23 }, duration: .72, ease: 'none' }, .28)
          .fromTo(q('[data-weather]'), { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: .2 }, .62);

        let accessFrame = 0;
        let syncAccess = () => {};
        const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: {
          id: 'find-yours-story', trigger: stage, start: 'top top',
          end: () => `+=${window.innerHeight * (memories ? 11 : 5.5)}`,
          pin: true, scrub: .45, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: -2,
          onRefresh: self => {
            const introEnd = memories ? self.start + (self.end - self.start) / 2 : self.end;
            element.dataset.scrollStart = String(self.start); element.dataset.scrollEnd = String(introEnd);
            if (memoryRoot) { memoryRoot.dataset.scrollStart = String(introEnd); memoryRoot.dataset.scrollEnd = String(self.end); }
            // Refresh temporarily rewinds animations while measuring the pin.
            // Restore the scrub position and DOM access after those measurements.
            cancelAnimationFrame(accessFrame);
            accessFrame = requestAnimationFrame(() => { self.animation?.progress(self.progress); syncAccess(); });
          },
        } });
        timeline.addLabel('question', 0)
          .to(intro, { scale: () => window.innerWidth < 1050 ? .43 : .48, x: () => Math.min(88, Math.max(24, window.innerWidth * .052)) * .52, y: 55, duration: 10, transformOrigin: '0% 0%' }, 7)
          .to(intro.querySelector('svg'), { autoAlpha: 0, duration: 5 }, 7)
          .to(scene, { autoAlpha: 1, duration: 9 }, 9)
          .to(q('[data-arrival-objects]'), { autoAlpha: 1, x: 200, y: -80, duration: 7 }, 13)
          .to(q('[data-indicators]'), { opacity: 1, duration: 4 }, 19)
          .addLabel('unplanned', 20)
          .to(mess, { progress: 1, duration: 23, ease: 'none' }, 20)
          .addLabel('freeze', 43)
          // Six timeline units deliberately contain no motion at the peak.
          .to(q('[data-rewind]'), { opacity: 1, duration: 2 }, 49)
          .to(mess, { progress: 0, duration: 12, ease: 'power3.inOut' }, 50)
          .to(q('[data-rewind]'), { rotation: -150, transformOrigin: '50% 50%', duration: 12 }, 50)
          .to(q('[data-rewind]'), { opacity: 0, duration: 2 }, 61)
          .to(q('[data-indicators]'), { opacity: 0, duration: 3 }, 61)
          .to(intro, { autoAlpha: 0, y: -40, duration: 6 }, 59)
          .addLabel('home', 62)
          .to(q('[data-map-shell]'), { attr: { transform: 'translate(626 209) scale(.48)' }, duration: 8 }, 62)
          .to(q('[data-home]'), { opacity: 1, duration: 7 }, 63)
          .to(q('[data-arrival-objects]'), { x: 0, y: 0, duration: 8 }, 62)
          .to(q('[data-passport]'), { y: -24, duration: 6 }, 64)
          .to(q('[data-preferences]'), { opacity: 1, duration: 4 }, 69)
          .to(q('[data-choice-fill]'), { opacity: 1, duration: 2, stagger: 1.4 }, 72)
          .to(q('[data-choice-ink]'), { color: '#f5f0e6', duration: 2, stagger: 1.4 }, 72)
          .to(q('[data-choice-check]'), { opacity: 1, duration: 2, stagger: 1.4 }, 72)
          .to(q('[data-preference]'), { x: 386, duration: 2, stagger: 1.4 }, 75)
          .to(q('[data-preferences]'), { opacity: 0, duration: 3 }, 79)
          .to(q('[data-clean]'), { opacity: 1, duration: 1 }, 79)
          .to(q('[data-clean-route]'), { strokeDashoffset: 0, duration: 7, ease: 'none' }, 79)
          .to(q('[data-clean-stop]'), { opacity: 1, duration: 1, stagger: 1.2 }, 80)
          .to(q('[data-day-order]'), { opacity: 1, duration: 2 }, 80)
          .from(q('[data-day-card]'), { x: '-=16', opacity: 0, duration: 2, stagger: 1 }, 80)
          .to(q('[data-stop-label]'), { opacity: 0, duration: 2 }, 79)
          .to(q('[data-indicators]'), { opacity: 1, duration: 3 }, 81)
          .to(q('[data-day]'), { fill: '#12372a', duration: 2, stagger: .25 }, 81)
          .to(q('[data-budget]'), { attr: { width: 122 }, fill: '#12372a', duration: 4 }, 81)
          .addLabel('planned', 86)
          .to(q('[data-phone]'), { opacity: 1, duration: 3 }, 86)
          .to(q('[data-map-shell]'), { attr: { transform: 'translate(993 396) scale(.27)' }, duration: 5 }, 87)
          .to(q('[data-passport]'), { x: -82, y: -100, rotation: 8, duration: 4 }, 87)
          .to(q('[data-case-seam]'), { scaleX: .85, duration: 3 }, 88)
          .to(q('[data-case-lid]'), { attr: { d: 'M199 380l8 0h89l8 0' }, duration: 3 }, 88)
          .to(q('[data-indicators]'), { opacity: 0, duration: 3 }, 89)
          .addLabel('phone', 91)
          .to(q('[data-phone]'), { y: -14, rotation: -3, transformOrigin: '50% 50%', duration: 2 }, 91)
          .to(q('[data-map-shell]'), { attr: { transform: 'translate(993 382) scale(.27)' }, duration: 2 }, 91)
          .addLabel('planner', 93)
          .to(q('[data-day-order]'), { opacity: 0, duration: 1.5 }, 92.5)
          .to(scene, { scale: 2.5, transformOrigin: '53% 46%', duration: 7 }, 93)
          .to(planner, { autoAlpha: 1, duration: 1.5 }, 93)
          .to(planner, { scale: 1, x: 0, y: 0, duration: 7 }, 93)
          .to(scene, { autoAlpha: 0, duration: 4 }, 96);
        scene.querySelectorAll<SVGGElement>('[data-interest-token]').forEach((token, index) => {
          const target = plannedStops[[1, 0, 2][index]].point;
          timeline.to(token, { opacity: 1, duration: .6 }, 76 + index)
            .to(token, { attr: { transform: `translate(${626 + (target.x - 250) * .48} ${209 + (target.y - 45) * .48})` }, duration: 3 }, 76 + index)
            .to(token, { opacity: 0, duration: 1 }, 79 + index);
        });
        element.querySelectorAll<HTMLElement>('[data-story-note]').forEach(note => {
          gsap.set(note, { autoAlpha: 0, y: 8 });
          timeline.to(note, { autoAlpha: 1, y: 0, duration: 1 }, Number(note.dataset.start))
            .to(note, { autoAlpha: 0, y: -8, duration: .8 }, Number(note.dataset.end));
        });
        if (memories) timeline.add(memories.timeline, 100);

        // Hide only the decorative narrative from assistive technology. The real
        // planner becomes focusable at handoff, and remains ordinary DOM after pin.
        const updateAccess = () => {
          const progress = Math.min(1, timeline.time() / 100);
          const ready = progress >= .985;
          planner.inert = !ready;
          planner.toggleAttribute('aria-hidden', !ready);
          if (!ready) planner.setAttribute('aria-hidden', 'true');
          element.dataset.phase = progress < .49 ? 'unplanned' : progress < .63 ? 'rewind' : progress < .79 ? 'home' : progress < .93 ? 'planned' : 'planner';
          memories?.update(Math.max(0, timeline.time() - 100));
        };
        timeline.eventCallback('onUpdate', updateAccess);
        syncAccess = updateAccess;
        const skip = element.querySelector<HTMLAnchorElement>('[data-skip-story]')!;
        const skipStory = (event: MouseEvent) => {
          event.preventDefault(); event.stopPropagation();
          const end = Number(element.dataset.scrollEnd);
          window.scrollTo({ top: end + 1, behavior: 'instant' });
          timeline.time(100);
          updateAccess();
          planner.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
        };
        skip.addEventListener('click', skipStory);
        const memorySkip = element.querySelector<HTMLAnchorElement>('[data-skip-memories]');
        const skipMemories = (event: MouseEvent) => {
          event.preventDefault(); event.stopPropagation();
          window.scrollTo({ top: timeline.scrollTrigger!.end + 1, behavior: 'instant' });
          timeline.progress(1); updateAccess(); memories?.focus();
        };
        memorySkip?.addEventListener('click', skipMemories);
        const heading = planner.querySelector('h2');
        heading?.setAttribute('tabindex', '-1');
        // Fonts can change preceding pinned heights; a single settled refresh
        // keeps direct navigation, resize and reverse scrolling in sync.
        let active = true;
        let refreshFrame = 0;
        let contentHeight = planner.offsetHeight;
        const contentObserver = new ResizeObserver(() => {
          const height = planner.offsetHeight;
          if (Math.abs(height - contentHeight) < 1) return;
          contentHeight = height;
          cancelAnimationFrame(refreshFrame);
          refreshFrame = requestAnimationFrame(() => { if (active) ScrollTrigger.refresh(); });
        });
        contentObserver.observe(planner);
        void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
        return () => {
          contentObserver.disconnect(); cancelAnimationFrame(refreshFrame); cancelAnimationFrame(accessFrame);
          active = false; skip.removeEventListener('click', skipStory); mess.kill();
          memorySkip?.removeEventListener('click', skipMemories); memories?.cleanup();
          delete element.dataset.enhanced; delete element.dataset.phase;
          delete element.dataset.scrollStart; delete element.dataset.scrollEnd;
          planner.inert = false; planner.removeAttribute('aria-hidden');
          heading?.removeAttribute('tabindex');
        };
      });
      teardown = () => media.revert();
    });
    return () => { disposed = true; teardown?.(); };
  }, [root]);
}
