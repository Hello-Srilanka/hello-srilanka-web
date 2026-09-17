'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, Download, ChevronDown, BedDouble, Clock3, Car, MapPin, Sun, Check, Info } from 'lucide-react';
import { dateLabel, dayDate, dayCount, travellers, tripDates, money, groupBudget, type Itinerary, type Source, type Cost } from '@/lib/planner/model';
import { safeUrl } from '@/lib/planner/validation';
import ExportPreview from './ExportPreview';
function SourceLinks({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return <span className="source-links">{ids.map(id => { const s = sources.find(s => s.id === id); return s && safeUrl(s.url) ? <a key={id} href={s.url} target="_blank" rel="noopener noreferrer">{s.title} <ArrowUpRight size={12} /></a> : null; })}</span>;
}
function CostLabel({ cost, currency }: { cost: Cost; currency: string }) { return <span className="item-cost">{cost.amount === null ? 'Check price and availability' : `${money(cost.amount, currency)} estimated · ${cost.basis}`}</span>; }
const destinationImage = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('sigiriya') || lower.includes('dambulla')) return 'sigiriya';
  if (lower.includes('ella') || lower.includes('nuwara')) return 'hero-train';
  if (lower.includes('galle')) return 'galle-lighthouse';
  if (lower.includes('kandy')) return 'nuwara-tea-country';
  if (lower.includes('negombo')) return 'negombo-sunset';
  return null;
};
export default function ItineraryView({ itinerary: t, newTrip, storageAvailable }: { itinerary: Itinerary; newTrip: () => void; storageAvailable: boolean }) {
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [exporting, setExporting] = useState(false);
  if (exporting) return <ExportPreview itinerary={t} close={() => { setExporting(false); requestAnimationFrame(() => document.getElementById('download-itinerary')?.focus()); }} />;
  const p = t.preferences;
  const destinations = t.days.map(d => d.destination).filter((d, i, all) => i === 0 || d !== all[i - 1]);
  return <article className="itinerary-page">
    <div className="itinerary-topline"><p className="eyebrow">YOUR NEXT CHAPTER, DAY BY DAY</p><button className="plan-text" onClick={newTrip}>Start a new trip <ArrowUpRight size={16} /></button></div>
    {t.mode === 'sample' && <div className="result-sample"><span>Sample itinerary</span> Illustrative ideas only. This is not live research; routes, prices and availability have not been verified.</div>}
    <header className="itinerary-heading"><div><h1 id="result-heading" tabIndex={-1}>{t.title}</h1><p>{t.summary}</p></div><button id="download-itinerary" className="plan-primary" onClick={() => setExporting(true)}><Download size={18} /> Download as image</button></header>
    <div className="trip-facts"><div><span>YOUR TIME HERE</span><strong>{dayCount(p)} days · {dayCount(p) - 1} nights</strong><small>{tripDates(p)}</small></div><div><span>YOUR PEOPLE</span><strong>{travellers(p)}</strong><small>{p.children ? `Children’s ages: ${p.ages.join(', ')}` : 'A journey for your group'}</small></div><div><span>YOUR RHYTHM</span><strong>{p.pace}</strong><small>{p.transport}</small></div><div><span>ESTIMATED COST</span><strong>{t.knownCost === null ? 'To be confirmed' : money(t.knownCost, p.currency)}</strong><small>{t.knownCost === null ? 'No supported price total available' : 'Known group costs only · incomplete'}</small></div></div>
    <div className="budget-qualification"><Info size={17} /><p>{groupBudget(p) !== null ? `Your budget target is ${money(groupBudget(p)!, p.currency)} for the group, ${p.flightsIncluded ? 'including' : 'excluding'} international flights. ` : 'No budget target set. '}Major unknowns: {t.unknownCosts.join('; ')}. Budget fit cannot be confirmed until these costs are known.</p></div>
    <div className="destination-sequence" aria-label="Destinations in order"><MapPin size={16} />{destinations.map((d, i) => <span key={`${d}-${i}`}>{i > 0 && <b aria-hidden="true">→</b>}{d}</span>)}</div>
    <div className="days-heading"><div><h2>The days ahead.</h2><p>A little structure. Plenty of room for the moment.</p></div><span><Check size={15} /> {storageAvailable ? 'Saved on this device' : 'Available in this tab'}</span></div>
    <div className="day-list">{t.days.map(day => {
      const open = expanded.includes(day.number), photo = destinationImage(day.destination), date = dayDate(p, day.number - 1);
      return <section className={`day-card ${open ? 'expanded' : ''}`} key={day.number}><h3><button className="day-toggle" aria-expanded={open} aria-controls={`day-${day.number}`} onClick={() => setExpanded(old => open ? old.filter(d => d !== day.number) : [...old, day.number])}><span className="day-number"><small>DAY</small>{String(day.number).padStart(2, '0')}</span>{photo && <span className="day-thumbnail"><Image src={`/images/${photo}.webp`} alt="" fill sizes="84px" /></span>}<span className="day-summary"><span className="day-date">{date ? dateLabel(date) : `Your ${day.number === 1 ? 'first' : 'next'} island day`}</span><strong>{day.destination}</strong><span>{day.highlights}</span><small><BedDouble size={13} />{day.overnight ? `Overnight in ${day.overnight}` : `Departure · ${day.endLocation}`}</small></span><ChevronDown size={21} className="day-chevron" /></button></h3>
        {open && <div id={`day-${day.number}`} className="day-content"><ol className="day-timeline">{day.items.map((item, i) => <li key={i} className={item.kind === 'transport' ? 'transport-item' : ''}><span className="timeline-icon">{item.kind === 'transport' ? <Car size={17} /> : <Sun size={17} />}</span><div><p className="timeline-period">{item.period}{item.kind === 'transport' ? ' · ON THE WAY' : ' · AT YOUR PACE'}</p><h4>{item.title}</h4><p>{item.description}</p>{item.kind === 'transport' && <p className="transport-route">{item.from} → {item.to}</p>}<div className="item-details"><span><Clock3 size={14} />{item.durationMinutes === null ? 'Journey time to confirm' : `Allow ~${item.durationMinutes} min${item.bufferMinutes ? ` + ${item.bufferMinutes} min buffer` : ''}`}</span><CostLabel cost={item.cost} currency={p.currency} /></div><SourceLinks ids={[...new Set([...item.sourceIds, ...item.cost.sourceIds])]} sources={t.sources} /></div></li>)}</ol>
          {day.stay && <div className="overnight-card"><BedDouble size={23} /><div><p className="eyebrow">REST YOUR HEAD · {day.overnight}</p><h4>{day.stay.name}</h4><p>{day.stay.description}</p><CostLabel cost={day.stay.cost} currency={p.currency} /><SourceLinks ids={[...new Set([...(day.stay.sourceId ? [day.stay.sourceId] : []), ...day.stay.cost.sourceIds])]} sources={t.sources} />{day.stay.sourceId && <p className="field-hint">Visit the provider to check rooms and availability. Nothing has been booked.</p>}</div></div>}
        </div>}
      </section>;
    })}</div>
    <div className="itinerary-notes"><section><p className="eyebrow">A LITTLE CONTEXT</p><h2>What this plan assumes.</h2><ul>{t.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></section><section><p className="eyebrow">BEFORE YOU GO</p><h2>Good to keep in mind.</h2><ul>{t.caveats.map((c, i) => <li key={i}>{c}</li>)}</ul></section></div>
    {t.sources.length > 0 && <details className="research-sources"><summary>Research sources & retrieval dates ({t.sources.length})</summary><ul>{t.sources.map(s => <li key={s.id}><SourceLinks ids={[s.id]} sources={t.sources} /><small>{s.retrievedAt ? `Retrieved ${new Date(s.retrievedAt).toLocaleString('en-GB')}` : 'Not live-retrieved'}</small></li>)}</ul></details>}
    <div className="itinerary-finish"><p>Your Sri Lanka. Your way.</p><span>This itinerary is read-only. Start a new trip to plan a different journey.</span><button className="plan-primary" onClick={() => setExporting(true)}>Keep this journey <Download size={17} /></button></div>
  </article>;
}
