'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { journeys } from '@/lib/content';
export function JourneyExamples() {
 const reduced = useReducedMotion();
 const [viewport, embla] = useEmblaCarousel({ loop: false, align: 'start', duration: reduced ? 0 : 25 });
 const [index, setIndex] = useState(0);
 const update = useCallback(() => { if (embla) setIndex(embla.selectedScrollSnap()); }, [embla]);
 useEffect(() => { if (!embla) return; embla.on('select', update); embla.on('reInit', update); return () => { embla.off('select', update); embla.off('reInit', update); }; }, [embla, update]);
 return <div className="journeys section-space"><div className="journeys-heading"><div><p className="eyebrow">04 — UNDERSTAND</p><h2 className="display">SAME ISLAND.<br /><span>COMPLETELY DIFFERENT</span><br />JOURNEYS.</h2></div><p>There’s no one way to do Sri Lanka.<br />Here are just four of them.</p></div>
  <div className="journey-tabs" aria-label="Choose a traveller profile">{journeys.map((journey, i) => <button type="button" key={journey.title} aria-pressed={i === index} className={i === index ? 'active' : ''} onClick={() => embla?.scrollTo(i, !!reduced)}><span>0{i + 1}</span>{journey.title}<ArrowUpRight size={16} /></button>)}</div>
  <div className="journey-carousel" role="region" aria-roledescription="carousel" aria-label="Example Sri Lanka journeys"><div className="embla-viewport" ref={viewport} onKeyDown={event => { if (event.key === 'ArrowRight') { event.preventDefault(); embla?.scrollNext(); } if (event.key === 'ArrowLeft') { event.preventDefault(); embla?.scrollPrev(); } }} tabIndex={0} aria-label="Journey slides. Use left and right arrow keys to explore."><div className="embla-container">{journeys.map((journey, i) => <article className="journey-slide" key={journey.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of 4: ${journey.title}`} aria-hidden={index !== i}><div className="journey-image"><Image src={`/images/${journey.image}.webp`} alt={journey.alt} fill sizes="(max-width: 600px) 88vw, 49vw" /><span className="eyebrow">YOUR JOURNEY, REIMAGINED</span><h3>{journey.feeling}</h3></div><div className={`journey-description accent-${journey.color}`}><span className="eyebrow">0{i + 1} — {journey.title.toUpperCase()}</span><p className="journey-intro">{journey.intro}</p><ol className="journey-route">{journey.route.map((place, number) => <li key={place}><span className="route-point" /><span className="route-number">0{number + 1}</span>{place}</li>)}</ol><p className="journey-detail">{journey.details}</p><span className="sample-note">A little inspiration. Your route will be your own.</span></div></article>)}</div></div><div className="carousel-controls"><span aria-live="polite">0{index + 1} <span>/ 04</span></span><p>DIFFERENT PEOPLE. DIFFERENT POSSIBILITIES.</p><div><button aria-label="Previous journey" disabled={index === 0} onClick={() => embla?.scrollPrev()}><ArrowLeft size={19} /></button><button aria-label="Next journey" disabled={index === 3} onClick={() => embla?.scrollNext()}><ArrowRight size={19} /></button></div></div></div>
  <p className="journey-manifesto">YOUR SRI LANKA<br />SHOULD FEEL <span>LIKE YOURS.</span></p>
 </div>;
}
