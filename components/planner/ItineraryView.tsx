'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Download, ChevronDown, BedDouble, Clock3, Car, MapPin, Sun, Moon, Sunset, Compass, Wallet, Pencil } from 'lucide-react';
import { dateLabel, dayDate, defaults, travellers, tripDates, money, groupBudget, type Itinerary, type Source, type Cost } from '@/lib/planner/model';
import { safeUrl } from '@/lib/planner/validation';
import { readCitations } from '@/lib/planner/citations';
import type { ExportSelection } from '@/lib/planner/export';
import ExportPreview from './ExportPreview';
import RevisionDialog from './RevisionDialog';
import TripRoute from './TripRoute';

function SourceLinks({ ids, sources }: { ids: string[]; sources: Map<string, Source> }) {
  const found = [...new Set(ids)].flatMap(id => sources.get(id) ?? []);
  if (!found.length) return null;
  return <details className="journal-evidence">
    <summary>{found.length === 1 ? 'Source' : 'Sources'} ({found.length})</summary>
    <ul>{found.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={13} aria-hidden="true" /></a></li>)}</ul>
  </details>;
}

function CostLabel({ cost, currency, basis }: { cost: Cost; currency: string; basis: string }) {
  return <div className={`journal-cost ${cost.amount === null ? 'unconfirmed' : ''}`}>
    <span>{cost.amount === null ? 'Price to confirm' : `${money(cost.amount, currency)} · group estimate`}</span>
    {cost.amount !== null && basis && <small>{basis}</small>}
  </div>;
}

export default function ItineraryView({ itinerary, newTrip }: { itinerary: Itinerary; newTrip: () => void }) {
  const router = useRouter();
  const [version, setVersion] = useState<Itinerary | null>(null);
  const [tabVersions, setTabVersions] = useState<Itinerary[]>([]);
  const [revising, setRevising] = useState<{ day: number | null; trigger: string } | null>(null);
  const t = version ?? itinerary;
  const firstDay = t.days[0]?.number;
  const [expanded, setExpanded] = useState<number[]>(firstDay === undefined ? [] : [firstDay]);
  const [activeDay, setActiveDay] = useState(firstDay);
  const [exporting, setExporting] = useState<ExportSelection | null>(null);
  const returnFocus = useRef('download-itinerary');

  function openExport(selection: ExportSelection, trigger = 'download-itinerary') {
    returnFocus.current = trigger;
    setExporting(selection);
  }

  function showVersion(next: Itinerary) {
    setVersion(next);
    const day = next.revision?.dayNumber ?? next.days[0]?.number;
    setExpanded(day === undefined ? [] : [day]);
    setActiveDay(day);
    requestAnimationFrame(() => document.getElementById('result-heading')?.focus());
  }

  function acceptRevision(next: Itinerary, saved: boolean) {
    setRevising(null);
    if (saved) { router.push(`/account/itineraries/${next.id}`); return; }
    setTabVersions(old => [...old, ...[t, next].filter(entry => !old.some(known => known.id === entry.id))]);
    showVersion(next);
  }

  if (exporting !== null) return <ExportPreview itinerary={t} initialSelection={exporting} close={() => {
    setExporting(null);
    requestAnimationFrame(() => document.getElementById(returnFocus.current)?.focus());
  }} />;

  const p = t.preferences;
  const allOpen = expanded.length === t.days.length;
  const sources = new Map(t.sources.filter(source => safeUrl(source.url)).map(source => [source.id, source]));
  const stops = t.days.map(day => readCitations(day.destination).text);
  const destinations = stops.filter((destination, index) => index === 0 || destination !== stops[index - 1]);
  const firstStay = t.days.find(day => day.stay)?.stay;
  const nights = t.days.filter(day => day.overnight).length;
  const dates = p.undecided ? (p.month === 'Any month' ? 'Flexible dates' : `${p.month} preferred`) : tripDates(p);
  const title = readCitations(t.title);
  const summary = readCitations(t.summary);
  const budget = groupBudget(p);
  const previous = t.revision && tabVersions.find(entry => entry.id === t.revision?.originalId);
  const newer = tabVersions.findLast(entry => entry.revision?.originalId === t.id);

  return <article className="journal-page">
    <header className="journal-cover">
      <div className="journal-cover-top">
        <p className="eyebrow">Island Journal{t.mode === 'sample' && <span className="journal-sample-label"> · Sample itinerary</span>}</p>
        <div className="journal-cover-actions">
          <button type="button" id="revise-itinerary" className="journal-download" onClick={() => setRevising({ day: null, trigger: 'revise-itinerary' })}><Pencil size={16} aria-hidden="true" /> Revise itinerary</button>
          <button type="button" id="download-itinerary" className="journal-download" onClick={() => openExport('full')}><Download size={17} aria-hidden="true" /> Download PDF</button>
        </div>
      </div>
      <h1 id="result-heading" tabIndex={-1}>{title.text}</h1>
      <ul className="journal-facts" aria-label="Trip at a glance">
        <li>{t.days.length} {t.days.length === 1 ? 'day' : 'days'}{nights > 0 && ` · ${nights} ${nights === 1 ? 'night' : 'nights'}`}</li>
        <li>{dates}</li>
        <li>{travellers(p)}{p.children > 0 && ` (ages ${p.ages.join(', ')})`}</li>
        <li>{p.pace} pace</li>
      </ul>
      <div className="journal-essentials">
        {firstStay && <p><BedDouble size={17} aria-hidden="true" /><span><strong>{destinations.length > 1 ? 'First suggested stay' : 'Suggested stay'}</strong> · {readCitations(firstStay.name).text}</span></p>}
      </div>
      {t.revision && <p className="journal-revision-version">{t.revision.dayNumber === null ? 'Whole-trip revision' : `Day ${t.revision.dayNumber} revision`} · {previous
        ? <button type="button" onClick={() => showVersion(previous)}>View previous version</button>
        : <Link href={`/account/itineraries/${t.revision.originalId}`}>View previous version</Link>}</p>}
      {newer && <p className="journal-revision-version"><button type="button" onClick={() => showVersion(newer)}>View newer revision</button></p>}
    </header>

    <TripRoute days={t.days} />

    <section className="journal-itinerary" aria-labelledby="journal-itinerary-heading">
      <div className="journal-days-heading">
        <h2 id="journal-itinerary-heading">Day-by-day itinerary</h2>
        <a className="plan-text" href="#journal-details">Costs &amp; trip details</a>
      </div>
      <nav className="journal-day-nav" aria-label="Jump to an itinerary day">
        {t.days.map((day, index) => <a key={day.number} href={`#journal-day-${day.number}`} aria-current={activeDay === day.number ? 'location' : undefined} onClick={() => {
          setActiveDay(day.number);
          setExpanded(old => old.includes(day.number) ? old : [...old, day.number]);
        }}><span>Day {day.number}</span>{destinations.length > 1 && <strong>{stops[index]}</strong>}</a>)}
      </nav>
      <div className="journal-days">
        {t.days.map((day, index) => {
          const open = expanded.includes(day.number);
          const date = dayDate(p, day.number - 1);
          const highlights = readCitations(day.highlights);
          const stayTitle = day.stay ? readCitations(day.stay.name) : null;
          const stayDescription = day.stay ? readCitations(day.stay.description) : null;
          const stayBasis = day.stay ? readCitations(day.stay.cost.basis) : null;

          return <section className={`journal-day${open ? ' expanded' : ''}`} id={`journal-day-${day.number}`} tabIndex={-1} key={day.number}>
            <h3>
              <button type="button" className="journal-day-toggle" aria-expanded={open} aria-controls={`day-${day.number}`} onClick={() => {
                setActiveDay(day.number);
                setExpanded(old => open ? old.filter(number => number !== day.number) : [...old, day.number]);
              }}>
                <span className="journal-day-number">Day {day.number}</span>
                <span className="journal-day-title">
                  <strong>{stops[index]}{date && <small>{dateLabel(date)}</small>}</strong>
                  <span>{highlights.text}</span>
                </span>
                <ChevronDown size={20} aria-hidden="true" />
              </button>
            </h3>
            <div id={`day-${day.number}`} className="journal-day-body" hidden={!open}>
              <div className="journal-day-tools">
                <span><MapPin size={15} aria-hidden="true" />{day.startLocation === day.endLocation ? day.startLocation : `${day.startLocation} → ${day.endLocation}`}</span>
                <div className="journal-day-actions">
                  <button id={`revise-day-${day.number}`} type="button" onClick={() => setRevising({ day: day.number, trigger: `revise-day-${day.number}` })}><Pencil size={15} aria-hidden="true" /> Revise this day</button>
                  <button id={`download-day-${day.number}`} type="button" onClick={() => openExport(day.number, `download-day-${day.number}`)}><Download size={15} aria-hidden="true" /> Save this day</button>
                </div>
              </div>
              <SourceLinks ids={highlights.ids} sources={sources} />
              <ol className="journal-timeline">{day.items.map((item, itemIndex) => {
                const Icon = item.kind === 'transport' ? Car : item.period === 'Evening' ? Moon : item.period === 'Afternoon' ? Sunset : Sun;
                const itemTitle = readCitations(item.title);
                const description = readCitations(item.description);
                const basis = readCitations(item.cost.basis);
                return <li className={`journal-stop ${item.kind}`} key={itemIndex}>
                  <span className="journal-stop-icon" aria-hidden="true"><Icon size={17} /></span>
                  <div className="journal-stop-card">
                    <p className="journal-stop-kind">{item.period} · {item.kind === 'transport' ? 'Transport' : 'Activity'}</p>
                    <h4>{itemTitle.text}</h4>
                    {item.kind === 'transport' && <p className="journal-transfer">{item.from} → {item.to}</p>}
                    <p>{description.text}</p>
                    <div className="journal-item-meta">
                      <span><Clock3 size={15} aria-hidden="true" />{item.durationMinutes === null ? 'Time to confirm' : `Allow ~${item.durationMinutes} min${item.bufferMinutes ? ` + ${item.bufferMinutes} min buffer` : ''}`}</span>
                      <CostLabel cost={item.cost} currency={p.currency} basis={basis.text} />
                    </div>
                    <SourceLinks ids={[...itemTitle.ids, ...description.ids, ...basis.ids, ...item.sourceIds, ...item.cost.sourceIds]} sources={sources} />
                  </div>
                </li>;
              })}</ol>
              {day.stay && stayTitle && stayDescription && stayBasis ? <div className="journal-stay">
                <BedDouble size={20} aria-hidden="true" />
                <div>
                  <p className="journal-stop-kind">Suggested stay · {day.overnight}</p>
                  <h4>{stayTitle.text}</h4>
                  <p>{stayDescription.text}</p>
                  <CostLabel cost={day.stay.cost} currency={p.currency} basis={stayBasis.text} />
                  <SourceLinks ids={[...stayTitle.ids, ...stayDescription.ids, ...stayBasis.ids, ...(day.stay.sourceId ? [day.stay.sourceId] : []), ...day.stay.cost.sourceIds]} sources={sources} />
                  <small className="journal-stay-note">Confirm rooms and availability with the provider.</small>
                </div>
              </div> : <div className="journal-departure">
                <Compass size={20} aria-hidden="true" />
                <span><strong>Departure</strong><small>Depart from {day.endLocation}. Confirm your transfer and departure details.</small></span>
              </div>}
            </div>
          </section>;
        })}
      </div>
      {t.days.length > 1 && <button type="button" className="plan-text journal-expand" onClick={() => setExpanded(allOpen ? [] : t.days.map(day => day.number))}>{allOpen ? 'Collapse all days' : 'Expand all days'}<ChevronDown size={16} aria-hidden="true" /></button>}
    </section>

    <section className="journal-details" id="journal-details" aria-labelledby="journal-details-heading" tabIndex={-1}>
      <h2 id="journal-details-heading">Costs &amp; trip details</h2>
      <details className="journal-budget" open>
        <summary><Wallet size={19} aria-hidden="true" /><span><strong>{t.knownCost === null ? 'Prices still to confirm' : `${money(t.knownCost, p.currency)} in known group costs`}</strong><small>{t.knownCost === null ? 'Budget target and estimated costs' : 'Partial estimate for the group'}</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
        <div>
          <p>{budget === null ? 'No group budget was set.' : `Group budget target: ${money(budget, p.currency)}.`} International flights are excluded.</p>
          {t.unknownCosts.length > 0 && <p><strong>Still to confirm:</strong> {t.unknownCosts.map(cost => readCitations(cost).text).join(', ')}.</p>}
          <p>Confirm prices and availability before booking.</p>
        </div>
      </details>
      <section className="journal-overview">
        <h3>Trip overview</h3>
        <p>{summary.text}</p>
        {p.transport !== defaults.transport && <p><strong>Preferred transport:</strong> {p.transport}</p>}
        <SourceLinks ids={[...title.ids, ...summary.ids]} sources={sources} />
      </section>
      <div className="journal-notes">
        {[{ label: 'Planning assumptions', notes: t.assumptions }, { label: 'Before you go', notes: t.caveats }].map(({ label, notes }) => <section key={label}>
          <h3>{label}</h3>
          <ul>{notes.map((note, index) => {
            const copy = readCitations(note);
            return <li key={index}>{copy.text}<SourceLinks ids={copy.ids} sources={sources} /></li>;
          })}</ul>
        </section>)}
      </div>
      {sources.size > 0 && <details className="journal-research">
        <summary>All research sources ({sources.size})</summary>
        <ul>{[...sources.values()].map(source => <li key={source.id}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={14} aria-hidden="true" /></a>
          <small>{source.retrievedAt ? `Retrieved ${new Date(source.retrievedAt).toLocaleString('en-GB')}` : 'Retrieval date unavailable'}</small>
        </li>)}</ul>
      </details>}
    </section>
    <footer className="journal-finish"><button type="button" className="plan-text" onClick={newTrip}>Plan another trip <ArrowUpRight size={16} aria-hidden="true" /></button></footer>
    {revising && <RevisionDialog itinerary={t} initialDay={revising.day} accept={acceptRevision} close={() => {
      const trigger = revising.trigger;
      setRevising(null);
      requestAnimationFrame(() => document.getElementById(trigger)?.focus());
    }} />}
  </article>;
}
