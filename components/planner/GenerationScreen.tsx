'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Compass } from 'lucide-react';

type Step = { title: string; detail: string };
type Card = { category: string; title: string; display: string; language?: string; body: string; source: string; sourceLabel: string };

const cards: Card[] = [
  {
    category: 'SAY HELLO · SINHALA', title: 'A wish for a long life', display: 'ආයුබෝවන්', language: 'Ayubowan',
    body: 'A traditional greeting that means “may you live long.” You may hear it as a warm welcome across the island.',
    source: 'https://www.srilanka.travel/buddhist-places/resources/GoldenIsle.pdf', sourceLabel: 'Sri Lanka Tourism',
  },
  {
    category: 'ISLAND FACT · HERITAGE', title: 'Stories set in stone and forest', display: '08',
    body: 'Sri Lanka has eight UNESCO World Heritage Sites, from ancient cities to the Sinharaja Forest Reserve.',
    source: 'https://whc.unesco.org/en/statesparties/lk', sourceLabel: 'UNESCO World Heritage Centre',
  },
  {
    category: 'ISLAND FACT · NATURE', title: 'A rainforest full of life', display: 'Sinharaja',
    body: 'The Sinharaja Forest Reserve protects Sri Lanka’s last viable area of primary tropical rainforest and many species found only on the island.',
    source: 'https://whc.unesco.org/en/list/405/', sourceLabel: 'UNESCO World Heritage Centre',
  },
  {
    category: 'LOCAL CUSTOM · SACRED PLACES', title: 'Visit with respect', display: 'A little care',
    body: 'When visiting temples and other holy places, check their dress guidance and dress respectfully.',
    source: 'https://www.gov.lk/index.php/sri-lanka/country-overview', sourceLabel: 'Sri Lanka government',
  },
];

function progress(mode: string, stages: string[]) {
  const current = stages.at(-1) || 'Connecting to your planner';
  if (mode === 'sample') {
    const steps: Step[] = [
      { title: 'Checking your preferences', detail: 'Making sure your trip details are ready.' },
      { title: 'Preparing a sample journey', detail: 'Putting together an illustrative route.' },
      { title: 'Checking the sample', detail: 'Checking days and connections before it opens.' },
    ];
    const active = current === 'Checking days, connections and cost estimates' || current === 'Your itinerary is ready' ? 2
      : current === 'Preparing your sample itinerary' ? 1 : 0;
    return { steps, active, message: steps[active].detail };
  }
  const reviewed = stages.includes('Using reviewed destinations and connections');
  const steps: Step[] = [
    { title: 'Checking your preferences', detail: 'Confirming your dates, travellers and interests.' },
    { title: reviewed ? 'Using reviewed travel knowledge' : 'Finding reliable travel details', detail: reviewed ? 'Using approved places and connections for this route.' : 'Looking into activities, stays and transport that fit your trip.' },
    { title: 'Building your daily journey', detail: 'Arranging places and travel into a day-by-day plan.' },
    { title: 'Checking the finished plan', detail: 'Checking days, connections, sources and costs.' },
  ];
  const active = current === 'Checking days, connections and cost estimates' || current === 'Your itinerary is ready' ? 3
    : current === 'Building your day-by-day journey' || current === 'Refining the route and timing' ? 2
      : current === 'Researching missing destinations, stays and transport' || current === 'Using reviewed destinations and connections' ? 1 : 0;
  const message = current === 'Refining the route and timing' ? 'A detail needs another look. We’re refining the route and timing.'
    : current === 'Checking reviewed Sri Lanka knowledge' ? 'Checking which travel facts have already been reviewed.'
      : current === 'Connecting to your planner' ? 'Connecting to the planner.' : steps[active].detail;
  return { steps, active, message };
}

export default function GenerationScreen({ mode, stages }: { mode: string; stages: string[] }) {
  const [cardIndex, setCardIndex] = useState(0);
  const { steps, active, message } = progress(mode, stages);
  const card = cards[cardIndex];
  const changeCard = (direction: number) => setCardIndex(index => (index + direction + cards.length) % cards.length);

  return <section className="generation-screen" aria-labelledby="generation-heading">
    <div className="generation-intro">
      <span className="generation-emblem" aria-hidden="true"><Compass size={30} strokeWidth={1.5} /></span>
      <div><p className="eyebrow">YOUR JOURNEY IS TAKING SHAPE</p><h1 id="generation-heading" tabIndex={-1}>{mode === 'sample' ? 'A glimpse of your Sri Lanka.' : 'Building your Sri Lanka.'}</h1><p>{mode === 'sample' ? 'We’re preparing an illustrative journey for you to explore.' : 'We’re finding places that fit your choices, then checking how the journey comes together.'}</p></div>
    </div>

    <div className="generation-grid">
      <section className="generation-progress-card" aria-labelledby="generation-progress-title">
        <div className="generation-card-top"><span className="eyebrow" id="generation-progress-title">YOUR PLAN, IN PROGRESS</span><span>{String(active + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span></div>
        <div className="generation-current"><span className="generation-current-pulse" aria-hidden="true" /><div><strong>Happening now</strong><p role="status" aria-live="polite" aria-atomic="true">{message}</p></div></div>
        <ol className="generation-stages">{steps.map((step, index) => {
          const state = index < active ? 'done' : index === active ? 'active' : 'waiting';
          return <li className={`generation-stage ${state}`} key={step.title}>
            <span className="generation-stage-icon" aria-hidden="true">{state === 'done' ? <Check size={17} /> : String(index + 1).padStart(2, '0')}</span>
            <div><strong>{step.title}</strong><small>{step.detail}</small></div><span className="generation-stage-state">{state === 'done' ? 'Done' : state === 'active' ? 'In progress' : 'Waiting'}</span>
          </li>;
        })}</ol>
        <p className="generation-progress-note">The next step begins when this one finishes. Your itinerary will open automatically when the checks are done.</p>
      </section>

      <aside className="generation-learn" aria-labelledby="generation-learn-title">
        <div className="generation-learn-head"><div><p className="eyebrow">A LITTLE ISLAND KNOWLEDGE</p><h2 id="generation-learn-title">While you wait…</h2></div><span>{String(cardIndex + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}</span></div>
        <article className="generation-fact-card" key={cardIndex}>
          <span className="generation-fact-category">{card.category}</span>
          <div className="generation-fact-body"><span className="generation-fact-display" lang={card.category.includes('SINHALA') ? 'si' : undefined}>{card.display}</span>{card.language && <span className="generation-fact-roman">{card.language}</span>}<h3>{card.title}</h3><p>{card.body}</p></div>
          <a href={card.source} target="_blank" rel="noopener noreferrer">Source: {card.sourceLabel} <ArrowUpRight size={14} /></a>
        </article>
        <div className="generation-card-controls"><button type="button" onClick={() => changeCard(-1)} aria-label="Previous island fact"><ArrowLeft size={18} /></button><span aria-hidden="true">{cards.map((_, index) => <i key={index} className={index === cardIndex ? 'current' : ''} />)}</span><button type="button" onClick={() => changeCard(1)} aria-label="Next island fact"><ArrowRight size={18} /></button></div>
      </aside>
    </div>
    <p className="generation-storage-note">Your answers are kept temporarily in this tab. If you refresh, return to review to reconnect to this request.</p>
  </section>;
}
