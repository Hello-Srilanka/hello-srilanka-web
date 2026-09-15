'use client';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { experiences } from '@/lib/content';
export function ExperienceEditorial() {
 const [selected, setSelected] = useState(0);
 const reduced = useReducedMotion();
 const current = experiences[selected];
 return <div id="experiences" className="editorial section-space"><div className="editorial-header"><p className="eyebrow">A SMALL ISLAND. A WORLD WITHIN.</p><p>Not one kind of holiday.<br />Every kind of feeling.</p></div>
  <div className="editorial-feature"><figure className="editorial-landscape"><Image src="/images/arugam-fishing-boats.webp" alt="Fishing boats along the turquoise shoreline at Arugam Bay" fill sizes="(max-width: 600px) 88vw, 52vw" /><figcaption><span>THE COAST IS CALLING.</span><span>ARUGAM BAY ↗</span></figcaption></figure><div className="editorial-aside"><span className="eyebrow">A DIFFERENT KIND OF EVERYDAY</span><h3>GET A<br />LITTLE<br /><span>LOST.</span></h3><p>In a conversation. In a new flavour.<br />In a place that feels like you.</p></div></div>
  <div className="experience-browser"><div className="experience-list" aria-label="Explore Sri Lanka experiences">{experiences.map((experience, i) => <div className={`experience-row ${selected === i ? 'selected' : ''}`} key={experience.name}><button aria-expanded={selected === i} aria-controls={`experience-detail-${i}`} onClick={() => setSelected(i)}><span className="experience-number">0{i + 1}</span><span className="experience-name">{experience.name.toUpperCase()}</span>{selected === i ? <Minus size={19} /> : <Plus size={19} />}</button><div id={`experience-detail-${i}`} hidden={selected !== i} className="experience-detail"><p>{experience.detail}</p><span>{experience.note}</span></div></div>)}</div>
   <div className="experience-preview"><AnimatePresence mode="wait" initial={false}><motion.figure key={current.name} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduced ? 1 : 0 }} transition={{ duration: reduced ? 0 : .25 }}><div className="experience-photo"><Image src={`/images/${current.image}.webp`} alt={current.alt} fill sizes="(max-width: 600px) 88vw, 40vw" /></div><figcaption><span className="eyebrow">{current.location}</span><ArrowUpRight size={22} strokeWidth={1} /></figcaption><p>{current.note}</p></motion.figure></AnimatePresence></div>
  </div>
 </div>;
}
