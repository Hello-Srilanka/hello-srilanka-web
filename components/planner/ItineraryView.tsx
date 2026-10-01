'use client';
import { useRef, useState } from 'react';
import { ArrowUpRight, Download, ChevronDown, BedDouble, Clock3, Car, MapPin, Sun, Moon, Sunset, Compass, CalendarDays, Users, Wallet } from 'lucide-react';
import { dateLabel, dayDate, dayCount, travellers, tripDates, money, groupBudget, type Itinerary, type Source, type Cost } from '@/lib/planner/model';
import { safeUrl } from '@/lib/planner/validation';
import type { ExportSelection } from '@/lib/planner/export';
import ExportPreview from './ExportPreview';

function SourceLinks({ ids, sources }: { ids: string[]; sources: Source[] }) {
  const found = [...new Set(ids)].map(id => sources.find(source => source.id === id)).filter((source): source is Source => !!source && safeUrl(source.url));
  if (!found.length) return null;
  return <details className="journal-evidence"><summary>{found.length} {found.length === 1 ? 'source' : 'sources'} & details</summary><ul>{found.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13} /></a></li>)}</ul></details>;
}
function CostLabel({ cost, currency }: { cost: Cost; currency: string }) {
  return <div className={`journal-cost ${cost.amount === null ? 'unconfirmed' : ''}`}><span>{cost.amount === null ? 'Price to confirm' : `${money(cost.amount, currency)} · group estimate`}</span>{cost.amount !== null && cost.basis && <small>{cost.basis}</small>}</div>;
}

export default function ItineraryView({ itinerary: t, newTrip }: { itinerary: Itinerary; newTrip: () => void }) {
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [exporting, setExporting] = useState<ExportSelection | null>(null);
  const returnFocus = useRef('download-itinerary');
  function openExport(selection: ExportSelection, trigger = 'download-itinerary') { returnFocus.current = trigger; setExporting(selection); }
  if (exporting !== null) return <ExportPreview itinerary={t} initialSelection={exporting} close={() => { setExporting(null); requestAnimationFrame(() => document.getElementById(returnFocus.current)?.focus()); }} />;
  const p = t.preferences, allOpen = expanded.length === t.days.length;
  const destinations = t.days.map(day => day.destination).filter((destination, index, all) => index === 0 || destination !== all[index - 1]);

  return <article className="journal-page">
    <div className="journal-topline"><p className="eyebrow">YOUR ISLAND JOURNAL</p><button type="button" className="plan-text" onClick={newTrip}>Plan another trip <ArrowUpRight size={16} /></button></div>
    <header className="journal-cover">
      <div className="journal-cover-copy"><span className="journal-edition">{t.mode === 'sample' ? 'SAMPLE ITINERARY' : 'YOUR PERSONALISED ITINERARY'}</span><h1 id="result-heading" tabIndex={-1}>{t.title}</h1><p>{t.summary}</p><button type="button" id="download-itinerary" className="plan-primary" onClick={() => openExport('overview')}><Download size={18} /> Download your journey</button></div>
      <div className="journal-stamp" aria-label={`${dayCount(p)} days in Sri Lanka`}><Compass size={30} strokeWidth={1.2} aria-hidden="true" /><strong>{String(dayCount(p)).padStart(2, '0')}</strong><span>DAYS IN SRI LANKA</span><small>Your Sri Lanka. Your way.</small></div>
    </header>
    <div className="journal-facts"><div><CalendarDays size={19} /><span><small>YOUR TIME HERE</small><strong>{tripDates(p)}</strong><em>{dayCount(p)} days · {Math.max(0, dayCount(p) - 1)} nights</em></span></div><div><Users size={19} /><span><small>YOUR PEOPLE</small><strong>{travellers(p)}</strong><em>{p.children ? `Children’s ages: ${p.ages.join(', ')}` : 'Your travel group'}</em></span></div><div><Compass size={19} /><span><small>YOUR RHYTHM</small><strong>{p.pace} pace</strong><em>{p.transport}</em></span></div></div>
    <p className="journal-status-note">{t.mode === 'sample' ? 'Sample only. These illustrative ideas have not been verified through live research.' : 'Built from travel research and reviewed information. Check the linked sources and availability before booking.'}</p>
    <div className="journal-route"><span className="eyebrow"><MapPin size={15} /> THE ROUTE</span><ol>{destinations.map((destination, index) => <li key={`${destination}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{destination}</li>)}</ol></div>
    <details className="journal-budget"><summary><Wallet size={20} /><span><strong>{t.knownCost === null ? 'Prices still to confirm' : `${money(t.knownCost, p.currency)} in known group costs`}</strong><small>{t.knownCost === null ? 'See your budget target and what needs checking' : 'A partial subtotal · see what is still unknown'}</small></span><ChevronDown size={18} /></summary><div><p>{groupBudget(p) !== null ? `Your group budget target is ${money(groupBudget(p)!, p.currency)}.` : 'You have not set a budget target.'} International flights are excluded.</p>{t.unknownCosts.length > 0 && <p><strong>Still to confirm:</strong> {t.unknownCosts.join('; ')}.</p>}<p>Confirm prices and availability before booking. This is not a complete trip-cost estimate.</p></div></details>

    <div className="journal-days-heading"><div><p className="eyebrow">ONE DAY AT A TIME</p><h2>The chapters ahead.</h2></div><button type="button" className="plan-text" onClick={() => setExpanded(allOpen ? [] : t.days.map(day => day.number))}>{allOpen ? 'Collapse all days' : 'Expand all days'}<ChevronDown size={16} /></button></div>
    <nav className="journal-day-nav" aria-label="Jump to an itinerary day">{t.days.map(day => <a key={day.number} href={`#journal-day-${day.number}`} onClick={() => setExpanded(old => old.includes(day.number) ? old : [...old, day.number])}><span>DAY {String(day.number).padStart(2, '0')}</span><strong>{day.destination}</strong></a>)}</nav>
    <div className="journal-days">{t.days.map(day => {
      const open = expanded.includes(day.number), date = dayDate(p, day.number - 1);
      return <section className={`journal-day ${open ? 'expanded' : ''}`} id={`journal-day-${day.number}`} tabIndex={-1} key={day.number}>
        <h3><button type="button" className="journal-day-toggle" aria-expanded={open} aria-controls={`day-${day.number}`} onClick={() => setExpanded(old => open ? old.filter(number => number !== day.number) : [...old, day.number])}><span className="journal-day-number"><small>DAY</small>{String(day.number).padStart(2, '0')}</span><span className="journal-day-title"><small>{date ? dateLabel(date) : 'YOUR DAILY CHAPTER'}</small><strong>{day.destination}</strong><span>{day.highlights}</span></span><ChevronDown size={23} /></button></h3>
        <div id={`day-${day.number}`} className="journal-day-body" hidden={!open}>
          <div className="journal-day-tools"><span><MapPin size={14} />{day.startLocation} → {day.endLocation}</span><button id={`download-day-${day.number}`} type="button" onClick={() => openExport(day.number, `download-day-${day.number}`)}><Download size={14} /> Save this day</button></div>
          <ol className="journal-timeline">{day.items.map((item, index) => {
            const Icon = item.kind === 'transport' ? Car : item.period === 'Evening' ? Moon : item.period === 'Afternoon' ? Sunset : Sun;
            return <li className={`journal-stop ${item.kind}`} key={index}><span className="journal-stop-icon" aria-hidden="true"><Icon size={18} /></span><div className="journal-stop-card"><p className="eyebrow">{item.period} · {item.kind === 'transport' ? 'ON THE WAY' : 'EXPLORE'}</p><h4>{item.title}</h4><p>{item.description}</p>{item.kind === 'transport' && <p className="journal-transfer">{item.from} → {item.to}</p>}<div className="journal-item-meta"><span><Clock3 size={14} />{item.durationMinutes === null ? 'Journey time to confirm' : `Allow ~${item.durationMinutes} min${item.bufferMinutes ? ` + ${item.bufferMinutes} min buffer` : ''}`}</span><CostLabel cost={item.cost} currency={p.currency} /></div><SourceLinks ids={[...item.sourceIds, ...item.cost.sourceIds]} sources={t.sources} /></div></li>;
          })}</ol>
          {day.stay ? <div className="journal-stay"><BedDouble size={24} /><div><p className="eyebrow">TONIGHT · {day.overnight}</p><h4>{day.stay.name}</h4><p>{day.stay.description}</p><CostLabel cost={day.stay.cost} currency={p.currency} /><SourceLinks ids={[...(day.stay.sourceId ? [day.stay.sourceId] : []), ...day.stay.cost.sourceIds]} sources={t.sources} /><small className="journal-stay-note">Confirm rooms and availability with the provider. Nothing has been booked.</small></div></div> : <div className="journal-departure"><Compass size={21} /><span><strong>Your onward journey</strong><small>Depart from {day.endLocation}. Confirm your transfer and departure details.</small></span></div>}
        </div>
      </section>;
    })}</div>
    <div className="journal-notes"><section><p className="eyebrow">A LITTLE CONTEXT</p><h2>What this plan assumes.</h2><ul>{t.assumptions.map((assumption, index) => <li key={index}>{assumption}</li>)}</ul></section><section><p className="eyebrow">BEFORE YOU GO</p><h2>Good to keep in mind.</h2><ul>{t.caveats.map((caveat, index) => <li key={index}>{caveat}</li>)}</ul></section></div>
    {t.sources.length > 0 && <details className="journal-research"><summary>All research sources ({t.sources.length})</summary><ul>{t.sources.filter(source => safeUrl(source.url)).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={14} /></a><small>{source.retrievedAt ? `Retrieved ${new Date(source.retrievedAt).toLocaleString('en-GB')}` : 'Retrieval date unavailable'}</small></li>)}</ul></details>}
    <footer className="journal-finish"><div><p className="eyebrow">TAKE THE ISLAND WITH YOU</p><h2>A journey worth keeping.</h2><p>Save an overview, the full itinerary, or just one day.</p></div><button id="download-full-itinerary" type="button" className="plan-primary" onClick={() => openExport('full', 'download-full-itinerary')}>Choose your download <Download size={17} /></button></footer>
    <div className="journal-mobile-save"><span>{dayCount(p)} days · {p.pace}</span><button id="mobile-download-itinerary" type="button" onClick={() => openExport('overview', 'mobile-download-itinerary')}><Download size={17} /> Download</button></div>
  </article>;
}
