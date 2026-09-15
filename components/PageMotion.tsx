'use client';
import { useEffect } from 'react';
export function PageMotion() {
 useEffect(() => {
  let dispose: (() => void) | undefined;
  let cancelled = false;
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  const start = async () => {
   dispose?.(); dispose = undefined;
   if (query.matches || !window.matchMedia('(pointer: fine)').matches) return;
   const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]);
   if (cancelled || query.matches) return;
   gsap.registerPlugin(ScrollTrigger);
   const lenis = new Lenis({ duration: .72, smoothWheel: true, syncTouch: false, anchors: { offset: -90 } });
   lenis.on('scroll', ScrollTrigger.update);
   const tick = (time: number) => lenis.raf(time * 1000);
   gsap.ticker.add(tick);
   dispose = () => { gsap.ticker.remove(tick); lenis.destroy(); };
  };
  void start(); query.addEventListener('change', start);
  return () => { cancelled = true; dispose?.(); query.removeEventListener('change', start); };
 }, []);
 return null;
}
