'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { Check, Coffee, Footprints, Zap, ArrowUpRight, ArrowLeft, Pencil, Plus, Minus, ChevronDown, Sun, Sparkles, Users, CalendarDays, Heart } from 'lucide-react';
import { transports, stays, currencies, months, tripDates, travellers, groupBudget, money, validatePreferences, type Preferences, type Errors } from '@/lib/planner/model';
import { discoverySteps, moments, rhythms, reviewStep, journeyStory, discoveryErrors } from '@/lib/planner/discovery';
import NationalityStep from './NationalityStep';
import TravelPostcard from './TravelPostcard';

type Props = {
  p: Preferences; step: number; furthest: number; editing: boolean; errors: Errors;
  update: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  go: (step: number) => void; next: () => void; generate: () => void;
  mode: string; saved: boolean; resume: () => void;
};
const titles = ['What is your nationality?', 'What would you like to do?', 'What pace suits you?', 'When are you travelling?', 'Review your trip.'];

function Field({ label, name, error, children, hint }: { label: string; name: string; error?: string; children: ReactNode; hint?: string }) {
  return <div className="plan-field"><label htmlFor={name}>{label}</label>{children}{hint && <p className="field-hint">{hint}</p>}{error && <p className="field-error" id={`${name}-error`}>{error}</p>}</div>;
}
function Counter({ label, note, name, value, min, max, change, error }: { label: string; note?: string; name: string; value: number; min: number; max: number; change: (n: number) => void; error?: string }) {
  return <div className="traveller-counter"><div><label htmlFor={name}>{label}</label>{note && <small>{note}</small>}</div><div className="counter-controls"><button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => change(value - 1)}><Minus size={16} /></button><input id={name} name={name} type="number" min={min} max={max} value={value} onChange={e => change(Math.min(max, Math.max(min, Number(e.target.value))))} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} /><button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => change(value + 1)}><Plus size={16} /></button></div>{error && <p id={`${name}-error`} className="field-error">{error}</p>}</div>;
}
export default function PlanningForm({ p, step, furthest, editing, errors, update, go, next, generate, mode, saved, resume }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [personaliseOpen, setPersonaliseOpen] = useState(false);
  const shownMoments = moments.filter((m, i) => showAll || i < 6 || p.interests.includes(m.name));
  function toggleMoment(name: string) {
    const removing = p.interests.includes(name);
    update('interests', removing ? p.interests.filter(i => i !== name) : [...p.interests, name]);
    // Collapsed extra cards disappear when deselected; keep keyboard focus in the chooser.
    if (removing && !showAll && moments.findIndex(m => m.name === name) >= 6) {
      requestAnimationFrame(() => document.getElementById('more-moments')?.focus());
    }
  }
  const story = journeyStory(p);
  const validDates = !Object.keys(discoveryErrors(p, 3)).some(k => ['arrivalDate', 'departureDate', 'duration', 'month'].includes(k));
  const validBudget = p.budget && !validatePreferences(p, 3).budget;
  const personaliseErrors = ['budget', 'currency', 'accommodation', 'transport', 'mustVisit'].some(key => !!errors[key]);
  const props = (name: keyof Preferences) => ({ id: name, name, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const text = (name: 'arrivalDate' | 'departureDate', label: string, type = 'text', hint?: string) => <Field key={name} name={name} label={label} error={errors[name]} hint={hint}><input {...props(name)} type={type} value={p[name]} onChange={e => update(name, e.target.value)} maxLength={160} {...(type === 'date' ? { min: new Date().toISOString().slice(0, 10) } : {})} /></Field>;
  const nextLabel = editing ? 'Save & return to review' : ['Choose my interests', 'Choose my pace', 'Add trip details', 'Review my trip'][step];
  return <div className={`discovery-layout discovery-step-${step}`}>
    <div className="discovery-sidebar"><TravelPostcard p={p} /></div>
    <section className="discovery-content" aria-labelledby="step-heading">
      <nav className="discovery-progress" aria-label="Planning progress"><ol>{discoverySteps.map((name, i) => <li key={name} className={step === i ? 'current' : furthest > i ? 'complete' : ''}><button type="button" disabled={i > furthest} aria-current={step === i ? 'step' : undefined} aria-label={`${name}, step ${i + 1} of ${discoverySteps.length}`} onClick={() => go(i)}><span>{furthest > i && step !== i ? <Check size={12} /> : `0${i + 1}`}</span><b>{name.replace('Your ', '')}</b></button></li>)}</ol></nav>
      <div className="step-intro discovery-intro"><p className="eyebrow">{['YOUR NATIONALITY', 'YOUR INTERESTS', 'YOUR PACE', 'YOUR TRIP DETAILS', 'YOUR TRIP'][step]}</p><h1 id="step-heading" tabIndex={-1}>{titles[step]}</h1></div>
      <form noValidate onSubmit={e => { e.preventDefault(); if (step === reviewStep) generate(); else next(); }}>
        <div className="discovery-fields" key={step}>
        {!!Object.keys(errors).length && <div className="plan-error" role="alert"><strong>A little more detail, please.</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={`#${key}`}>{message}</a></li>)}</ul></div>}
        {step === 0 && <NationalityStep p={p} errors={errors} update={update} />}
        {step === 1 && <div className="moments-section"><fieldset className="interest-photo-fieldset" id="interests" aria-describedby={errors.interests ? 'interests-error' : 'moments-hint'}><legend className="sr-only">Choose your interests</legend><div className="moment-grid">{shownMoments.map(m => <label className={`moment-card ${p.interests.includes(m.name) ? 'selected' : ''}`} key={m.name}><input type="checkbox" aria-label={m.name} aria-invalid={!!errors.interests} checked={p.interests.includes(m.name)} onChange={() => toggleMoment(m.name)} /><Image src={`/images/${m.image}.webp`} alt="" fill sizes="(max-width: 760px) 44vw, (max-width: 1200px) 24vw, 17vw" /><span className="moment-shade" /><span className="selection-mark">{p.interests.includes(m.name) ? <Check size={14} /> : <Plus size={14} />}</span><span className="moment-caption"><small>{m.name}</small><strong>{m.title}</strong><span>{m.note}</span></span></label>)}</div></fieldset><div className="moment-tools"><button type="button" className="plan-text" id="more-moments" aria-expanded={showAll} onClick={() => setShowAll(v => !v)}>{showAll ? 'A little less' : 'More ways to explore'}<ChevronDown size={15} className={showAll ? 'turned' : ''} /></button></div>{errors.interests && <p id="interests-error" className="field-error">{errors.interests}</p>}</div>}
        {step === 2 && <fieldset className="choice-fieldset" id="pace"><legend className="sr-only">Your travel pace</legend><div className="rhythm-choices">{rhythms.map((rhythm, i) => { const Icon = [Coffee, Footprints, Zap][i]; return <label key={rhythm.value} className={`rhythm-card ${p.pace === rhythm.value ? 'selected' : ''}`}><input type="radio" name="pace" aria-label={rhythm.value} checked={p.pace === rhythm.value} onChange={() => update('pace', rhythm.value)} /><div className="rhythm-heading"><Icon size={24} strokeWidth={1.4} /><div><strong>{rhythm.title}</strong><small>{rhythm.value} pace · {rhythm.note}</small></div><span className="rhythm-check">{p.pace === rhythm.value && <Check size={14} />}</span></div><div className="rhythm-day">{rhythm.beats.map((beat, j) => <span key={beat}><i>{['AM', 'MIDDAY', 'PM'][j]}</i>{beat}</span>)}</div></label>; })}</div><p className="discovery-aside-note"><Sun size={15} /> A feel for the rhythm, not your final day-by-day plan.</p></fieldset>}
        {step === 3 && <div className="question-stack">
          <fieldset className="choice-fieldset"><legend className="sr-only">Your dates</legend><div className="date-choice-row"><label className={!p.undecided ? 'selected' : ''}><input type="radio" name="dateMode" checked={!p.undecided} onChange={() => update('undecided', false)} /><CalendarDays size={18} /> I have dates in mind{!p.undecided && <Check size={14} />}</label><label className={p.undecided ? 'selected' : ''}><input type="radio" name="dateMode" checked={p.undecided} onChange={() => update('undecided', true)} /><Sun size={18} /> I haven’t chosen dates{p.undecided && <Check size={14} />}</label></div></fieldset>
          {p.undecided ? <><div className="duration-picks" aria-label="Trip duration suggestions">{[5, 7, 10, 14, 21].map(n => <button type="button" key={n} aria-pressed={p.duration === n} onClick={() => update('duration', n)}>{n}<small>days</small></button>)}</div><div className="field-grid"><Field name="duration" label="How many days?" error={errors.duration} hint="Choose 1–21 days, including travel days."><input {...props('duration')} type="number" min={1} max={21} value={p.duration || ''} onChange={e => update('duration', Number(e.target.value))} /></Field><Field name="month" label="Preferred month" error={errors.month}><select {...props('month')} value={p.month} onChange={e => update('month', e.target.value)}>{months.map(m => <option key={m}>{m}</option>)}</select></Field></div></> : <><div className="field-grid">{text('arrivalDate', 'Arrival date', 'date')}{text('departureDate', 'Departure date', 'date')}</div>{errors.duration && <p id="duration-error" className="field-error">{errors.duration}</p>}</>}
          <div className="question-divider" /><div className="question-heading"><Users size={19} /><h2 className="question-title">Who is travelling?</h2></div><div className="traveller-counters"><Counter name="adults" label="Adults" note="18 and over" min={1} max={12} value={p.adults} change={v => update('adults', v)} error={errors.adults} /><Counter name="children" label="Children" note="Little explorers, 0–17" min={0} max={8} value={p.children} change={v => update('children', v)} error={errors.children} /></div>
          {p.children > 0 && <fieldset className="ages-fields" id="ages"><legend>Children’s ages</legend><div className="field-grid">{p.ages.map((age, i) => <Field key={i} name={`age-${i}`} label={`Child ${i + 1}`}><input id={`age-${i}`} aria-invalid={!!errors.ages} aria-describedby={errors.ages ? 'ages-error' : undefined} type="number" min={0} max={17} value={age} onChange={e => update('ages', p.ages.map((v, j) => i === j ? e.target.value : v))} /></Field>)}</div>{errors.ages && <p id="ages-error" className="field-error">{errors.ages}</p>}</fieldset>}
          <Field name="accessibility" label="Walking, dietary or access needs? (optional)" hint="Tell us about walking limits, step-free access or dietary needs. Leave out contact and medical details." error={errors.accessibility}><textarea {...props('accessibility')} maxLength={600} rows={2} placeholder="For example: limited stairs or vegetarian meals" value={p.accessibility} onChange={e => update('accessibility', e.target.value)} /></Field>
        </div>}
        {step === reviewStep && <div className="review-stack">
          <div className="journey-brief">
            <div className="brief-photos" aria-hidden="true">{(p.interests.length ? p.interests.slice(0, 3).map(i => moments.find(m => m.name === i)!) : moments.slice(0, 3)).filter(Boolean).map(m => <div key={m.name}><Image src={"/images/" + m.image + ".webp"} alt="" fill sizes="(max-width: 760px) 30vw, 20vw" /></div>)}<span><Heart size={16} /> MADE OF YOUR FAVOURITE THINGS</span></div>
            <div className="brief-copy"><p>{story.duration || 'A little time away'} for {p.adults + p.children}.</p><h2>{story.title}</h2></div>
          </div>
          <ReviewBlock title="Your nationality" edit={() => go(0)}>
            <p>{p.nationality === 'Other' ? p.otherNationality : p.nationality === 'Prefer not to say' || !p.nationality ? 'Not provided' : p.nationality}</p>
            {p.useNationalitySuggestions && <p>Include nationality-based activity ideas</p>}
          </ReviewBlock>
          <ReviewBlock title="Your interests & pace" edit={() => go(1)}>
            <div className="review-tags">{p.interests.map(i => <span key={i}>{i}</span>)}</div>
            <p>{p.pace} pace <button className="inline-edit" type="button" onClick={() => go(2)}>Change pace</button></p>
          </ReviewBlock>
          <ReviewBlock title="Your dates & travellers" edit={() => go(3)}>
            <strong>{validDates ? tripDates(p) : 'Dates to confirm'}</strong>
            <p>{travellers(p)}{p.children > 0 && ' · Ages ' + p.ages.join(', ')}</p>
            <p>Arrive: {p.arrival}{p.arrivalTime && ' · ' + p.arrivalTime}<br />Depart: {p.departure}{p.departureTime && ' · ' + p.departureTime}</p>
            {p.accessibility && <p><strong>Plan around:</strong> {p.accessibility}</p>}
          </ReviewBlock>
          <details className="discovery-details personalise-details" open={personaliseOpen || personaliseErrors} onToggle={event => setPersonaliseOpen(event.currentTarget.open)}>
            <summary><span>Personalise further<small>Optional budget, hotels, transport and must-visits</small></span><Plus size={17} /></summary>
            <div className="details-fields">
              <div className="budget-chapter">
                <div className="field-grid budget-grid">
                  <Field name="budget" label="Total budget for everyone (optional)" error={errors.budget} hint="Leave blank if undecided. Covers your trip in Sri Lanka; international flights are excluded.">
                    <input {...props('budget')} inputMode="decimal" type="text" placeholder="No budget yet" value={p.budget} maxLength={12} onChange={e => update('budget', e.target.value)} />
                  </Field>
                  <Field name="currency" label="Currency" error={errors.currency}>
                    <select {...props('currency')} value={p.currency} onChange={e => update('currency', e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select>
                  </Field>
                </div>
                {validBudget && <p className="field-hint">Group target: {money(groupBudget(p)!, p.currency)}.</p>}
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
            </div>
          </details>
        </div>}
        </div>
        <div className="form-actions discovery-actions">{step > 0 ? <button className="plan-back" type="button" onClick={() => go(editing ? reviewStep : step - 1)}><ArrowLeft size={17} />{editing ? 'Back to review' : 'Back'}</button> : <span className="first-step-note"> </span>}<button className="plan-primary" type="submit" disabled={step === reviewStep && mode === 'checking'}>{step === reviewStep ? 'Create my itinerary' : nextLabel}<ArrowUpRight size={19} /></button></div>
      </form>
      {step === 0 && saved && <button className="saved-journey-link plan-text" type="button" onClick={resume}>Return to your saved itinerary <ArrowUpRight size={15} /></button>}
    </section>
  </div>;
}
function ReviewBlock({ title, edit, children }: { title: string; edit: () => void; children: ReactNode }) { return <section className="review-block"><div><h2>{title}</h2><button type="button" onClick={edit} aria-label={`Edit ${title.toLowerCase()}`}><Pencil size={14} /> Edit</button></div><div className="review-body">{children}</div></section>; }
