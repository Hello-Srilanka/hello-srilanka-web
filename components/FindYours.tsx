'use client';
import { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
export function FindYours() {
 const root = useRef<HTMLDivElement>(null);
 useEffect(() => { let cancelled = false; let cleanup: (() => void) | undefined;
  void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
   if (cancelled) return; gsap.registerPlugin(ScrollTrigger); const match = gsap.matchMedia();
   match.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => { gsap.fromTo('.question-word', { color: '#687662' }, { color: '#12372a', stagger: .22, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 70%', end: '65% 50%', scrub: .5 } }); }); cleanup = () => match.revert();
  }); return () => { cancelled = true; cleanup?.(); }; }, []);
 return <div className="find-question section-space" ref={root}><p className="eyebrow">03 — FIND YOURS</p><div className="question-layout"><h2 className="display"><span className="question-word">BUT WHICH</span><br /><span className="question-word">SRI LANKA</span><br /><span className="question-word">IS YOURS?</span></h2><div className="question-note"><ArrowDown strokeWidth={1} size={42} /><p>You don’t need to travel<br />like everyone else.</p><p>Tell us what excites you and we’ll<br />shape the journey around you.</p></div></div></div>;
}
