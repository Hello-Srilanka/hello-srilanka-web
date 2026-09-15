'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Check, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
const interests = [
 { name: 'Nature', image: 'nuwara-tea-country', text: 'A little closer to the wild.', alt: 'Rolling green tea plantations in the hill country' },
 { name: 'Food', image: 'food-vendor', text: 'A seat at the local table.', alt: 'A Sri Lankan street-food vendor cooking' },
 { name: 'Wildlife', image: 'elephants-udawalawe', text: 'Room for the unexpected.', alt: 'Wild elephants in Udawalawe' },
 { name: 'Adventure', image: 'sigiriya', text: 'A view worth waking up for.', alt: 'Sigiriya rock fortress above the forest' },
 { name: 'Culture', image: 'galle-lighthouse', text: 'Stories around every corner.', alt: 'The historic Galle lighthouse at sunset' },
 { name: 'Nightlife', image: 'negombo-sunset', text: 'Let the evening unfold.', alt: 'People on Negombo beach at sunset' },
 { name: 'Slow Travel', image: 'train-person', text: 'Time to take it all in.', alt: 'A traveller watching the landscape from a train' },
];
export function PersonalizationExperience() {
 const [selected, setSelected] = useState(['Nature', 'Slow Travel']);
 const [last, setLast] = useState('Nature');
 const reduced = useReducedMotion();
 const current = interests.find(interest => interest.name === last) ?? interests[0];
 function select(name: string) { const next = selected.includes(name) ? selected.filter(item => item !== name) : [...selected, name]; setSelected(next); setLast(next.includes(name) ? name : next.at(-1) ?? 'Nature'); }
 return <div className="personalization section-space"><div className="personalization-copy"><p className="eyebrow">INTRODUCING HELLOSRILANKA</p><h2 className="display">NOT JUST<br />AN ITINERARY.<br /><span>YOUR ITINERARY.</span></h2><p className="body-copy">Tell us how long you’re staying, what you love, how you like to travel and what you want to spend.</p><p className="body-copy">HelloSriLanka brings it together to create a journey designed around you.</p><a className="text-link" href="/plan">Let’s make it yours <ArrowUpRight size={19} /></a></div>
  <div className="travel-profile"><div className="profile-heading"><span className="eyebrow">THE START OF SOMETHING PERSONAL</span><span className="profile-dot" /></div><div className="profile-image"><motion.div key={current.image} initial={{ opacity: reduced ? 1 : .4 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .35 }}><Image src={`/images/${current.image}.webp`} alt={current.alt} fill sizes="(max-width: 900px) 88vw, 40vw" /></motion.div><div className="profile-image-copy" aria-live="polite"><span>YOUR KIND OF SRI LANKA</span><p>{selected.length ? current.text : 'A thousand possibilities. Start anywhere.'}</p></div></div><fieldset className="interest-fieldset"><legend>What draws you in?</legend><div className="interest-options">{interests.map(interest => <motion.button type="button" key={interest.name} className={selected.includes(interest.name) ? 'selected' : ''} aria-pressed={selected.includes(interest.name)} onClick={() => select(interest.name)} whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: .97 }}>{interest.name}{selected.includes(interest.name) ? <Check size={14} /> : <Plus size={14} />}</motion.button>)}</div></fieldset><div className="profile-factors"><span>INTERESTS</span><span>BUDGET</span><span>TRAVEL DATES</span><span>PACE</span><span>EXPERIENCES</span><span>TRANSPORT</span></div><p className="profile-footnote">A little inspiration. Your full journey starts next.</p></div>
  <div className="brand-promise"><span>AI-powered.</span><span>Sri Lanka-informed.</span><span>Uniquely yours.</span></div>
 </div>;
}
