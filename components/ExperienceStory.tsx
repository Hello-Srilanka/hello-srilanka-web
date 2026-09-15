'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { storyScenes } from '@/lib/content';
export function ExperienceStory() {
 const root = useRef<HTMLDivElement>(null);
 const [active, setActive] = useState(0);
 useEffect(() => {
  let cancelled = false; let cleanup: (() => void) | undefined;
  void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
   if (cancelled || !root.current) return;
   gsap.registerPlugin(ScrollTrigger); const match = gsap.matchMedia();
   match.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    root.current?.classList.add('story-cinematic');
    const panels = gsap.utils.toArray<HTMLElement>('.story-scene', root.current);
    gsap.set(panels.slice(1), { clipPath: 'inset(100% 0 0 0)' });
    const timeline = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 90px', end: '+=220%', pin: true, scrub: .6, anticipatePin: 1, onUpdate: self => setActive(Math.min(4, Math.floor(self.progress * 5))) } });
    panels.slice(1).forEach((panel, i) => { timeline.to(panel, { clipPath: 'inset(0% 0 0 0)', duration: 1, ease: 'none' }, i + .4); });
    return () => { root.current?.classList.remove('story-cinematic'); setActive(0); };
   }); cleanup = () => match.revert();
  });
  return () => { cancelled = true; cleanup?.(); };
 }, []);
 return <div className="story" ref={root} aria-label="Five ways to feel Sri Lanka">
  {storyScenes.map((scene, i) => <article key={scene.name} className={`story-scene story-scene-${i}`}><Image src={`/images/${scene.image}.webp`} alt={scene.alt} fill sizes="100vw" /><div className="story-shade" /><div className="story-top"><span className="eyebrow">FOLLOW A DIFFERENT FEELING</span><ArrowDownRight size={28} strokeWidth={1} /></div><div className="story-content"><p className="eyebrow">0{i + 1} / 05 &nbsp; — &nbsp; {scene.location}</p><h3>{i === 0 ? 'WILD' : scene.name.toUpperCase()}.</h3><p>{scene.note}</p></div><span className="story-caption">{scene.detail}</span></article>)}
  <div className="story-progress" aria-hidden="true">{storyScenes.map((scene, i) => <span key={scene.name} className={active === i ? 'active' : ''} />)}</div>
  <a className="story-skip" href="#experiences">Explore all experiences <ArrowUpRight size={16} /></a>
 </div>;
}
