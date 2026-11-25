'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Check, Coffee, Footprints, Zap, ArrowUpRight, ArrowLeft, Pencil, Plus, Minus, Sun, CalendarDays, Heart } from 'lucide-react';
import { defaults, transports, stays, currencies, months, tripDates, travellers, groupBudget, money, type Preferences, type Errors } from '@/lib/planner/model';
import { datesStep, discoverySteps, moments, personaliseStep, rhythms, reviewStep, travellersStep, journeyStory, discoveryErrors } from '@/lib/planner/discovery';
import NationalityStep from './NationalityStep';
import TravelPostcard from './TravelPostcard';

type Props = {
  p: Preferences; step: number; furthest: number; editing: boolean; errors: Errors;
  update: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  go: (step: number) => void; next: () => void; generate: () => void;
  mode: string; saved: boolean; resume: () => void;
};
const stepContent = [
  { eyebrow: 'YOUR NATIONALITY', title: 'What is your nationality?', next: 'Choose my interests' },
  { eyebrow: 'YOUR INTERESTS', title: 'What would you like to do?', next: 'Choose my pace' },
  { eyebrow: 'YOUR PACE', title: 'What pace suits you?', next: 'Add trip details' },
  { eyebrow: 'YOUR TRIP DATES', title: 'When are you travelling?', next: 'Add travellers' },
  { eyebrow: 'YOUR TRAVELLERS', title: 'Who is travelling?', next: 'Personalise my trip' },
  { eyebrow: 'TRIP PREFERENCES', title: 'Personalise further', next: 'Review my trip' },
  { eyebrow: 'YOUR TRIP', title: 'Review your trip.', next: 'Create my itinerary' },
];

function Field({ label, name, error, children, hint }: { label: string; name: string; error?: string; children: ReactNode; hint?: string }) {
  return <div className="plan-field"><label htmlFor={name}>{label}</label>{children}{hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}{error && <p className="field-error" id={`${name}-error`}>{error}</p>}</div>;
}
function Counter({ label, note, name, value, min, max, change, error }: { label: string; note?: string; name: string; value: number; min: number; max: number; change: (n: number) => void; error?: string }) {
  return <div className="traveller-counter"><div><label htmlFor={name}>{label}</label>{note && <small>{note}</small>}</div><div className="counter-controls"><button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => change(value - 1)}><Minus size={16} /></button><input id={name} name={name} type="number" min={min} max={max} value={value} onChange={e => change(Math.min(max, Math.max(min, Number(e.target.value))))} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} /><button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => change(value + 1)}><Plus size={16} /></button></div>{error && <p id={`${name}-error`} className="field-error">{error}</p>}</div>;
}
export default function PlanningForm({ p, step, furthest, editing, errors, update, go, next, generate, mode, saved, resume }: Props) {
  function toggleMoment(name: string) {
    const removing = p.interests.includes(name);
    update('interests', removing ? p.interests.filter(i => i !== name) : [...p.interests, name]);
  }
  const story = journeyStory(p);
  const validDates = !Object.keys(discoveryErrors(p, datesStep)).some(k => ['arrivalDate', 'departureDate', 'duration', 'month'].includes(k));
  const { budget: budgetError, currency: currencyError } = discoveryErrors(p, personaliseStep);
  const budget = groupBudget(p);
  const budgetLabel = budget !== null && !budgetError && !currencyError ? money(budget, p.currency) : null;
  const preferredCurrency = p.currency !== defaults.currency ? p.currency : null;
  const hotel = p.accommodation !== defaults.accommodation ? p.accommodation : null;
  const transport = p.transport !== defaults.transport ? p.transport : null;
  const mustVisit = p.mustVisit.trim();
  const props = (name: keyof Preferences) => ({ id: name, name, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const text = (name: 'arrivalDate' | 'departureDate', label: string, type = 'text', hint?: string) => <Field key={name} name={name} label={label} error={errors[name]} hint={hint}><input {...props(name)} type={type} value={p[name]} onChange={e => update(name, e.target.value)} maxLength={160} {...(type === 'date' ? { min: new Date().toISOString().slice(0, 10) } : {})} /></Field>;
  const { eyebrow, title, next: continueLabel } = stepContent[step];
  const nextLabel = editing && step !== reviewStep ? 'Save & return to review' : continueLabel;
  return <div className={`discovery-layout discovery-step-${step}`}>
    <div className="discovery-sidebar"><TravelPostcard p={p} /></div>
    <section className="discovery-content" aria-labelledby="step-heading">
      <nav className="discovery-progress" aria-label="Planning progress"><ol>{discoverySteps.map((name, i) => <li key={name} className={step === i ? 'current' : furthest > i ? 'complete' : ''}><button type="button" disabled={i > furthest} aria-current={step === i ? 'step' : undefined} aria-label={`${name}, step ${i + 1} of ${discoverySteps.length}`} onClick={() => go(i)}><span>{furthest > i && step !== i ? <Check size={12} /> : `0${i + 1}`}</span><b>{name.replace('Your ', '')}</b></button></li>)}</ol></nav>
      <div className="step-intro discovery-intro"><p className="eyebrow">{eyebrow}</p><h1 id="step-heading" tabIndex={-1}>{title}</h1></div>
      <form noValidate onSubmit={e => { e.preventDefault(); if (step === reviewStep) generate(); else next(); }}>
        <div className="discovery-fields" key={step}>
        {!!Object.keys(errors).length && <div className="plan-error" role="alert"><strong>A little more detail, please.</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={`#${key}`}>{message}</a></li>)}</ul></div>}
        {step === 0 && <NationalityStep p={p} errors={errors} update={update} />}
        {step === 1 && <div className="moments-section">
          <fieldset className="interest-photo-fieldset" id="interests" aria-describedby={errors.interests ? 'interests-error' : undefined}>
            <legend className="sr-only">Choose your interests</legend>
            <div className="moment-grid">
              {moments.map(moment => {
                const selected = p.interests.includes(moment.name);
                return <label className={`moment-card ${selected ? 'selected' : ''}`} key={moment.name}>
                  <input type="checkbox" aria-label={moment.name} aria-invalid={!!errors.interests} checked={selected} onChange={() => toggleMoment(moment.name)} />
                  <Image src={moment.cardImage} alt="" fill unoptimized />
                  <span className="moment-shade" />
                  <span className="selection-mark">{selected ? <Check size={14} /> : <Plus size={14} />}</span>
                  <span className="moment-caption"><small>{moment.name}</small><span>{moment.note}</span></span>
                </label>;
              })}
            </div>
          </fieldset>
          {errors.interests && <p id="interests-error" className="field-error">{errors.interests}</p>}
        </div>}
        {step === 2 && <fieldset className="choice-fieldset" id="pace"><legend className="sr-only">Your travel pace</legend><div className="rhythm-choices">{rhythms.map((rhythm, i) => { const Icon = [Coffee, Footprints, Zap][i]; return <label key={rhythm.value} className={`rhythm-card ${p.pace === rhythm.value ? 'selected' : ''}`}><input type="radio" name="pace" aria-label={rhythm.value} checked={p.pace === rhythm.value} onChange={() => update('pace', rhythm.value)} /><div className="rhythm-heading"><Icon size={24} strokeWidth={1.4} /><div><strong>{rhythm.title}</strong><small>{rhythm.value} pace · {rhythm.note}</small></div><span className="rhythm-check">{p.pace === rhythm.value && <Check size={14} />}</span></div><div className="rhythm-day">{rhythm.beats.map((beat, j) => <span key={beat}><i>{['AM', 'MIDDAY', 'PM'][j]}</i>{beat}</span>)}</div></label>; })}</div></fieldset>}
        {step === datesStep && <div className="question-stack">
          <fieldset className="choice-fieldset"><legend className="sr-only">Your dates</legend><div className="date-choice-row"><label className={!p.undecided ? 'selected' : ''}><input type="radio" name="dateMode" checked={!p.undecided} onChange={() => update('undecided', false)} /><CalendarDays size={18} /> I have dates in mind{!p.undecided && <Check size={14} />}</label><label className={p.undecided ? 'selected' : ''}><input type="radio" name="dateMode" checked={p.undecided} onChange={() => update('undecided', true)} /><Sun size={18} /> I haven’t chosen dates{p.undecided && <Check size={14} />}</label></div></fieldset>
          {p.undecided ? <><div className="duration-picks" aria-label="Trip duration suggestions">{[5, 7, 10, 14, 21].map(n => <button type="button" key={n} aria-pressed={p.duration === n} onClick={() => update('duration', n)}>{n}<small>days</small></button>)}</div><div className="field-grid"><Field name="duration" label="How many days?" error={errors.duration} hint="Choose 1–21 days, including travel days."><input {...props('duration')} type="number" min={1} max={21} value={p.duration || ''} onChange={e => update('duration', Number(e.target.value))} /></Field><Field name="month" label="Preferred month" error={errors.month}><select {...props('month')} value={p.month} onChange={e => update('month', e.target.value)}>{months.map(m => <option key={m}>{m}</option>)}</select></Field></div></> : <><div className="field-grid">{text('arrivalDate', 'Arrival date', 'date')}{text('departureDate', 'Departure date', 'date')}</div>{errors.duration && <p id="duration-error" className="field-error">{errors.duration}</p>}</>}
        </div>}
        {step === travellersStep && <div className="question-stack">
          <div className="traveller-counters">
            <Counter name="adults" label="Adults" note="18 and over" min={1} max={12} value={p.adults} change={v => update('adults', v)} error={errors.adults} />
            <Counter name="children" label="Children" note="Little explorers, 0–17" min={0} max={8} value={p.children} change={v => update('children', v)} error={errors.children} />
          </div>
          {p.children > 0 && <fieldset className="ages-fields" id="ages"><legend>Children’s ages</legend><div className="field-grid">{p.ages.map((age, i) => <Field key={i} name={`age-${i}`} label={`Child ${i + 1}`}><input id={`age-${i}`} aria-invalid={!!errors.ages} aria-describedby={errors.ages ? 'ages-error' : undefined} type="number" min={0} max={17} value={age} onChange={e => update('ages', p.ages.map((v, j) => i === j ? e.target.value : v))} /></Field>)}</div>{errors.ages && <p id="ages-error" className="field-error">{errors.ages}</p>}</fieldset>}
          <Field name="accessibility" label="Walking, dietary or access needs? (optional)" hint="Tell us about walking limits, step-free access or dietary needs. Leave out contact and medical details." error={errors.accessibility}>
            <textarea {...props('accessibility')} aria-describedby={errors.accessibility ? 'accessibility-hint accessibility-error' : 'accessibility-hint'} maxLength={600} rows={2} placeholder="For example: limited stairs or vegetarian meals" value={p.accessibility} onChange={e => update('accessibility', e.target.value)} />
          </Field>
        </div>}
        {step === personaliseStep && <div className="question-stack personalise-fields">
          <div className="budget-chapter">
            <div className="field-grid budget-grid">
              <Field name="budget" label="Total budget for everyone (optional)">
                <input {...props('budget')} aria-describedby={errors.budget ? 'budget-hint budget-error' : 'budget-hint'} inputMode="decimal" type="text" placeholder="No budget yet" value={p.budget} maxLength={12} onChange={e => update('budget', e.target.value)} />
              </Field>
              <Field name="currency" label="Currency">
                <select {...props('currency')} value={p.currency} onChange={e => update('currency', e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select>
              </Field>
            </div>
            <p className="field-hint" id="budget-hint">Leave blank if undecided. Covers your trip in Sri Lanka; international flights are excluded.</p>
            {errors.budget && <p className="field-error" id="budget-error">{errors.budget}</p>}
            {errors.currency && <p className="field-error" id="currency-error">{errors.currency}</p>}
            {budgetLabel && <p className="field-hint">Group target: {budgetLabel}.</p>}
          </div>
          <div className="field-grid">
            <Field name="accommodation" label="Hotel preference (optional)" error={errors.accommodation}>
              <select {...props('accommodation')} value={p.accommodation} onChange={e => update('accommodation', e.target.value)}>{stays.map(value => <option key={value}>{value}</option>)}</select>
            </Field>
            <Field name="transport" label="Transport preference (optional)" error={errors.transport}>
              <select {...props('transport')} value={p.transport} onChange={e => update('transport', e.target.value)}>{transports.map(value => <option key={value}>{value}</option>)}</select>
            </Field>
          </div>
          <Field name="mustVisit" label="Any places you do not want to miss? (optional)" error={errors.mustVisit}>
            <textarea {...props('mustVisit')} maxLength={600} rows={2} placeholder="For example: Ella or Galle" value={p.mustVisit} onChange={e => update('mustVisit', e.target.value)} />
          </Field>
        </div>}
        {step === reviewStep && <div className="review-stack">
          <div className="journey-brief">
            <div className="brief-photos" aria-hidden="true">{(p.interests.length ? p.interests.slice(0, 3).map(i => moments.find(m => m.name === i)!) : moments.slice(0, 3)).filter(Boolean).map(m => <div key={m.name}><Image src={"/images/" + m.image + ".webp"} alt="" fill sizes="(max-width: 760px) 30vw, 20vw" /></div>)}<span><Heart size={16} /> MADE OF YOUR FAVOURITE THINGS</span></div>
            <div className="brief-copy"><p>{story.duration || 'A little time away'} for {p.adults + p.children}.</p><h2>{story.title}</h2></div>
          </div>
          <ReviewBlock title="Your nationality" edit={() => go(0)}>
            <p>{p.nationality === 'Other' ? p.otherNationality : p.nationality === 'Prefer not to say' || !p.nationality ? 'Not provided' : p.nationality}</p>
          </ReviewBlock>
          <ReviewBlock title="Your interests & pace" edit={() => go(1)}>
            <div className="review-tags">{p.interests.map(i => <span key={i}>{i}</span>)}</div>
            <p>{p.pace} pace <button className="inline-edit" type="button" onClick={() => go(2)}>Change pace</button></p>
          </ReviewBlock>
          <ReviewBlock title="Your dates" edit={() => go(datesStep)}>
            <strong>{validDates ? tripDates(p) : 'Dates to confirm'}</strong>
            <p>Arrive: {p.arrival}{p.arrivalTime && ' · ' + p.arrivalTime}<br />Depart: {p.departure}{p.departureTime && ' · ' + p.departureTime}</p>
          </ReviewBlock>
          <ReviewBlock title="Your travellers" edit={() => go(travellersStep)}>
            <p>{travellers(p)}{p.children > 0 && ' · Ages ' + p.ages.join(', ')}</p>
            {p.accessibility && <p><strong>Plan around:</strong> {p.accessibility}</p>}
          </ReviewBlock>
          <ReviewBlock title="Travel preferences" edit={() => go(personaliseStep)}>
            {budgetLabel ? <p><strong>Budget for everyone:</strong> {budgetLabel}</p> : preferredCurrency && <p><strong>Currency:</strong> {preferredCurrency}</p>}
            {hotel && <p><strong>Hotel:</strong> {hotel}</p>}
            {transport && <p><strong>Transport:</strong> {transport}</p>}
            {mustVisit && <p><strong>Must-visits:</strong> {mustVisit}</p>}
            {!budgetLabel && !preferredCurrency && !hotel && !transport && !mustVisit && <p>No optional preferences added.</p>}
          </ReviewBlock>
        </div>}
        </div>
        <div className="form-actions discovery-actions">{step > 0 ? <button className="plan-back" type="button" onClick={() => go(editing ? reviewStep : step - 1)}><ArrowLeft size={17} />{editing ? 'Back to review' : 'Back'}</button> : <span className="first-step-note"> </span>}<button className="plan-primary" type="submit" disabled={step === reviewStep && mode === 'checking'}>{nextLabel}<ArrowUpRight size={19} /></button></div>
      </form>
      {step === 0 && saved && <button className="saved-journey-link plan-text" type="button" onClick={resume}>Return to your saved itinerary <ArrowUpRight size={15} /></button>}
    </section>
  </div>;
}
function ReviewBlock({ title, edit, children }: { title: string; edit: () => void; children: ReactNode }) { return <section className="review-block"><div><h2>{title}</h2><button type="button" onClick={edit} aria-label={`Edit ${title.toLowerCase()}`}><Pencil size={14} /> Edit</button></div><div className="review-body">{children}</div></section>; }
