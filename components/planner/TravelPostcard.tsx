import Image from 'next/image';
import { ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { journeyStory, moments } from '@/lib/planner/discovery';
import { travellers, type Preferences } from '@/lib/planner/model';

export default function TravelPostcard({ p, compact = false }: { p: Preferences; compact?: boolean }) {
  const selected = p.interests.map(i => moments.find(m => m.name === i)).filter(m => !!m);
  const photos = selected.length ? selected.slice(-3).reverse() : [moments[3], moments[1], moments[4]];
  const story = journeyStory(p);
  return <aside className={`travel-postcard ${compact ? 'postcard-compact' : ''}`} aria-label="Your Sri Lanka so far">
    <div className="postcard-top"><span className="eyebrow">YOUR SRI LANKA SO FAR</span><Compass size={22} strokeWidth={1.2} /></div>
    <div className="postcard-photos" aria-hidden="true">
      <div className="postcard-main" key={photos[0].image}><Image src={`/images/${photos[0].image}.webp`} alt="" fill sizes={compact ? '(max-width: 760px) 85vw, 45vw' : '(max-width: 760px) 110px, 33vw'} priority /><span>{selected.length ? photos[0].name : 'A journey waiting to happen'}</span></div>
      <div className="postcard-inset" key={(photos[1] || moments[1]).image}><div><Image src={`/images/${(photos[1] || moments[1]).image}.webp`} alt="" fill sizes="180px" /></div><span>Your next chapter <ArrowUpRight size={13} /></span></div>
      <div className="postcard-stamp"><span>HELLO</span><Sparkles size={24} strokeWidth={1} /><span>SRI LANKA</span></div>
    </div>
    <div className="postcard-copy" aria-live="polite" aria-atomic="true"><p className="postcard-handwritten">A little more you, with every choice.</p><h2>{story.title}</h2><p>{story.description}</p><div className="postcard-chips">{story.duration && <span>{story.duration}</span>}{selected.length > 0 && <span>{selected.length} {selected.length === 1 ? 'thing' : 'things'} you love</span>}{compact && <span>{travellers(p)}</span>}</div></div>
    <div className="postcard-bottom"><span>YOUR SRI LANKA. YOUR WAY.</span><span>Inspiration, shaped by your choices.<br />Your day-by-day plan comes next.</span></div>
  </aside>;
}
