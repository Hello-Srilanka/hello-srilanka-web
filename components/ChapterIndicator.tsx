'use client';
import { useEffect, useState } from 'react';
const chapters = [['01', 'Arrive', 'arrive'], ['02', 'Experience', 'experience'], ['03', 'Find yours', 'find-yours'], ['04', 'Understand', 'understand'], ['05', 'Go', 'go']];
export function ChapterIndicator() {
 const [active, setActive] = useState('01');
 useEffect(() => {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
  let frame = 0;
  const update = () => {
   frame = 0;
   const current = sections.filter(section => section.getBoundingClientRect().top <= window.innerHeight * .5).at(-1);
   if (current?.dataset.chapter) setActive(current.dataset.chapter);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  update(); window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule);
  return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
 }, []);
 return <nav className={`chapter-indicator chapter-${active}`} aria-label="Journey chapters">{chapters.map(([number, name, id]) => <a key={number} className={active === number ? 'active' : ''} href={`#${id}`} aria-label={`${number} — ${name}`} aria-current={active === number ? 'location' : undefined}><span>{name}</span><i />{number}</a>)}</nav>;
}
