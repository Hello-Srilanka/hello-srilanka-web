import { useEffect, type RefObject } from 'react';
import { landmarkReveal, type LandmarkSpec } from '@/lib/experience-map/landmarks';
import { flightPosition, getFlightPath, phase, smooth } from '@/lib/experience-map/flight';
import { destinationRoutes, destinationRoutePosition, destinationRouteProgress } from '@/lib/experience-map/destinationRoutes';

export function useExperienceScroll(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const match = gsap.matchMedia();
      match.add({ motion: '(prefers-reduced-motion: no-preference)', reduced: '(prefers-reduced-motion: reduce)', compact: '(max-width: 600px)' }, context => {
        const stage = element.querySelector<HTMLElement>('[data-journey-stage]')!;
        const controls = element.querySelectorAll<HTMLElement>('[data-map-controls]');
        const plane = element.querySelector<SVGGElement>('[data-plane]')!;
        const shadow = element.querySelector<SVGGElement>('[data-plane-shadow]')!;
        const reveal = element.querySelector<SVGPathElement>('[data-route-reveal]')!;
        const route = element.querySelector<SVGPathElement>('[data-route]')!;
        const ring = element.querySelector<SVGCircleElement>('[data-arrival-ring]')!;
        const skip = element.querySelector<HTMLButtonElement>('[data-skip-flight]');
        const onwardRoutes = destinationRoutes.map(route => ({
          route,
          group: element.querySelector<SVGGElement>(`[data-destination-route="${route.destination.id}"]`)!,
          reveal: element.querySelector<SVGPathElement>(`[data-destination-route-reveal="${route.destination.id}"]`)!,
          arrow: element.querySelector<SVGGElement>(`[data-destination-route-arrow="${route.destination.id}"]`)!,
          progress: -1,
        }));
        const landmarks = Array.from(element.querySelectorAll<HTMLElement>('[data-destination]')).map(button => ({ button, importance: button.dataset.landmarkImportance as LandmarkSpec['importance'], order: Number(button.dataset.landmarkOrder) }));
        const compact = Boolean(context.conditions?.compact);
        reveal.setAttribute('d', getFlightPath(compact));
        route.setAttribute('d', getFlightPath(compact));
        let interactive: boolean | undefined;
        const update = (progress: number) => {
          const transition = smooth(phase(progress, .14, .46));
          element.style.setProperty('--intro-opacity', `${1 - smooth(phase(progress, .23, .45))}`);
          element.style.setProperty('--intro-scale', `${1 - transition * .24}`);
          element.style.setProperty('--intro-y', `${transition * -55}px`);
          element.style.setProperty('--map-opacity', `${smooth(phase(progress, .25, .58))}`);
          element.style.setProperty('--map-scale', `${.78 + smooth(phase(progress, .35, .82)) * .22}`);
          element.style.setProperty('--map-x', `${(1 - smooth(phase(progress, .3, .82))) * 14}%`);
          element.style.setProperty('--guide-opacity', `${smooth(phase(progress, .65, .83))}`);
          element.style.setProperty('--marker-progress', `${phase(progress, .74, .94)}`);
          element.style.setProperty('--arrival-opacity', `${smooth(phase(progress, .57, .7))}`);
          element.style.setProperty('--flight-opacity', `${smooth(phase(progress, .2, .26))}`);
          element.style.setProperty('--approach-opacity', `${smooth(phase(progress, .42, .5)) * (1 - smooth(phase(progress, .6, .69)))}`);
          const flight = phase(progress, .22, .7);
          const position = flightPosition(flight, compact);
          const scale = (compact ? 1.3 : 1.1) - smooth(phase(flight, .65, 1)) * (compact ? .55 : .45);
          const transform = `translate(${position.x} ${position.y}) rotate(${position.angle}) scale(${scale})`;
          plane.setAttribute('transform', transform);
          shadow.setAttribute('transform', `translate(${position.x + 2} ${position.y + 5 + (1 - flight) * 35}) rotate(${position.angle}) scale(${scale})`);
          shadow.style.opacity = `${phase(flight, .65, 1) * .2}`;
          reveal.style.strokeDashoffset = `${1 - position.distance}`;
          route.style.opacity = `${.55 - phase(progress, .72, .9) * .32}`;
          ring.setAttribute('r', `${17 + Math.sin(phase(progress, .68, .75) * Math.PI) * 9}`);
          element.dataset.arrived = String(progress >= .7);
          onwardRoutes.forEach((onward, index) => {
            const routeProgress = destinationRouteProgress(progress, index);
            if (onward.progress === routeProgress) return;
            onward.progress = routeProgress;
            const tip = destinationRoutePosition(onward.route, routeProgress);
            onward.reveal.style.strokeDashoffset = `${1 - routeProgress}`;
            onward.group.style.setProperty('--route-opacity', `${smooth(phase(routeProgress, 0, .08))}`);
            onward.arrow.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${tip.angle})`);
          });
          landmarks.forEach(({ button, importance, order }) => button.style.setProperty('--landmark-reveal', String(landmarkReveal(progress, importance, order))));
          element.dataset.journeyProgress = String(progress);
          const nextInteractive = progress >= .94;
          if (interactive !== nextInteractive) {
            interactive = nextInteractive;
            element.dataset.interactive = String(interactive);
            controls.forEach(control => { control.inert = !interactive; control.setAttribute('aria-hidden', String(!interactive)); });
          }
        };
        if (context.conditions?.reduced) {
          element.dataset.motion = 'static';
          update(1);
          return () => { delete element.dataset.motion; };
        }
        element.dataset.motion = 'scroll';
        update(0);
        const playhead = { progress: 0 };
        const tween = gsap.to(playhead, {
          progress: 1, ease: 'none', onUpdate: () => update(playhead.progress),
          scrollTrigger: {
            id: 'sri-lanka-arrival', trigger: element, pin: stage,
            start: () => `top ${window.innerWidth > 900 ? 91 : 76}px`,
            end: () => `+=${window.innerHeight * (window.innerWidth <= 600 ? 2.8 : 3.4)}`,
            scrub: .45, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
          },
        });
        const skipFlight = () => {
          const trigger = tween.scrollTrigger;
          if (!trigger) return;
          window.scrollTo({ top: trigger.end - 1, behavior: 'instant' });
          trigger.update();
          tween.progress(1);
          element.querySelector<HTMLButtonElement>('[data-destination]')?.focus({ preventScroll: true });
        };
        skip?.addEventListener('click', skipFlight);
        const refresh = () => { if (!cancelled) ScrollTrigger.refresh(); };
        void document.fonts.ready.then(refresh);
        return () => {
          skip?.removeEventListener('click', skipFlight);
          delete element.dataset.motion;
          controls.forEach(control => { control.inert = false; control.removeAttribute('aria-hidden'); });
        };
      });
      cleanup = () => match.revert();
    }).catch(() => { /* The server-rendered map remains fully available. */ });
    return () => { cancelled = true; cleanup?.(); };
  }, [root]);
}
