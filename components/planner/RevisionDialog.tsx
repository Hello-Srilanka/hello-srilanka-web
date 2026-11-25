'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, X } from 'lucide-react';
import { interests, money, type Itinerary } from '@/lib/planner/model';
import { readCitations } from '@/lib/planner/citations';
import { comparableDay } from '@/lib/planner/day-comparison';
import { PlannerRequestError, requestPlan } from '@/lib/planner/request';
import type { RevisionGoal, RevisionOptions } from '@/lib/planner/revision';

function DayDetails({ label, day, currency }: { label: string; day: ReturnType<typeof comparableDay>; currency: string }) {
  return <section>
    <h3>{label} · {day.destination}</h3>
    <p>{day.startLocation === day.endLocation ? day.startLocation : `${day.startLocation} → ${day.endLocation}`}</p>
    <ul>
      {day.items.map((item, index) => <li key={index}>
        <strong>{item.period} · {item.title}</strong>
        <small>{item.description}</small>
        {(item.durationMinutes !== null || item.bufferMinutes > 0 || item.amount !== null) && <small>
          {[
            item.durationMinutes !== null && `${item.durationMinutes} min`,
            item.bufferMinutes > 0 && `${item.bufferMinutes} min buffer`,
            item.amount !== null && `${money(item.amount, currency)} group estimate`,
          ].filter(Boolean).join(' · ')}
        </small>}
      </li>)}
      {day.stay && <li><strong>Stay · {day.stay.name}</strong><small>{day.stay.description}</small>{day.stay.amount !== null && <small>{money(day.stay.amount, currency)} group estimate</small>}</li>}
    </ul>
  </section>;
}

export default function RevisionDialog({ itinerary, initialDay, close, accept }: {
  itinerary: Itinerary;
  initialDay: number | null;
  close: () => void;
  accept: (revision: Itinerary, saved: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const pending = useRef<AbortController | null>(null);
  const requestId = useRef<string | null>(null);
  const [scope, setScope] = useState<'trip' | 'day'>(initialDay === null ? 'trip' : 'day');
  const [day, setDay] = useState(initialDay ?? itinerary.days[0]?.number ?? 1);
  const [goal, setGoal] = useState<RevisionGoal>(itinerary.mode === 'sample' ? 'interests' : 'custom');
  const [interest, setInterest] = useState('');
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState('');
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ itinerary: Itinerary; canSave: boolean } | null>(null);
  const sample = itinerary.mode === 'sample';

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { pending.current?.abort(); element?.close(); };
  }, []);

  const adjustedDays = preview?.itinerary.days.flatMap((day, index) => {
    const original = comparableDay(itinerary.days[index]);
    const revised = comparableDay(day);
    return JSON.stringify(original) === JSON.stringify(revised) ? [] : [{ number: day.number, original, revised }];
  }) ?? [];
  const budgetError = scope === 'trip' && budget && (!/^\d+(\.\d{1,2})?$/.test(budget) || Number(budget) <= 0 || Number(budget) > 100000000);
  const needsNote = goal === 'custom' && !(scope === 'trip' && budget);
  const ready = !budgetError && (!needsNote || Boolean(note.trim())) && (goal !== 'interests' || Boolean(interest));

  function resetRequest() {
    requestId.current = null;
    setError('');
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending.current) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12 * 60 * 1000);
    pending.current = controller;
    const id = requestId.current ?? crypto.randomUUID();
    requestId.current = id;
    const options: RevisionOptions = { dayNumber: scope === 'day' ? day : null, goal, interest, note, budget: scope === 'trip' ? budget : '' };
    setError('');
    setStage('Preparing your revision');
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(itinerary)));
      const proof = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const result = await requestPlan({ id, revision: { originalId: itinerary.id, proof, options } }, controller.signal, event => {
        if (event.stage) setStage(event.stage);
      });
      setPreview(result);
      requestAnimationFrame(() => previewHeading.current?.focus());
    } catch (error) {
      if (error instanceof PlannerRequestError && error.finished) requestId.current = null;
      setError(controller.signal.aborted ? 'The request timed out. Try again to reconnect.' : error instanceof Error ? error.message : 'Could not prepare the revision. Please try again.');
    } finally {
      clearTimeout(timeout);
      pending.current = null;
      setStage('');
    }
  }

  async function save() {
    if (!preview || pending.current) return;
    if (!preview.canSave) { accept(preview.itinerary, false); return; }
    const controller = new AbortController();
    pending.current = controller;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/itinerary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: preview.itinerary.id }), signal: controller.signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not save this revision yet. Please try again.');
      }
      accept(preview.itinerary, true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save this revision yet. Please try again.');
    } finally {
      pending.current = null;
      setSaving(false);
    }
  }

  return <dialog ref={dialog} className="journal-revision" aria-labelledby="revision-heading" onCancel={event => { event.preventDefault(); if (!saving) close(); }}>
    <div className="journal-revision-heading">
      <h2 id="revision-heading" ref={previewHeading} tabIndex={-1}>{preview ? 'Preview changes' : 'Revise itinerary'}</h2>
      <button type="button" className="journal-revision-close" aria-label="Close revision" onClick={close} disabled={saving}><X size={20} aria-hidden="true" /></button>
    </div>
    {error && <p className="journal-revision-error" role="alert">{error}</p>}
    {preview ? <div className="journal-revision-preview">
      <p>{adjustedDays.length ? `${adjustedDays.length} ${adjustedDays.length === 1 ? 'day changed' : 'days changed'}.` : 'Trip preferences updated.'} Your original itinerary is available to revisit.</p>
      <p><strong>Known group costs</strong> {itinerary.knownCost === null && preview.itinerary.knownCost === null ? 'To confirm' : <>
        {itinerary.knownCost === null ? 'To confirm' : money(itinerary.knownCost, itinerary.preferences.currency)} <ArrowRight size={14} role="img" aria-label="to" /> {preview.itinerary.knownCost === null ? 'To confirm' : money(preview.itinerary.knownCost, preview.itinerary.preferences.currency)}. Partial estimates.
      </>}</p>
      {preview.itinerary.preferences.pace !== itinerary.preferences.pace && <p><strong>Pace</strong> {preview.itinerary.preferences.pace}</p>}
      {preview.itinerary.preferences.budget !== itinerary.preferences.budget && <p><strong>Group budget target</strong> {money(Number(preview.itinerary.preferences.budget), preview.itinerary.preferences.currency)}</p>}
      {adjustedDays.map((current, index) => <details key={current.number} open={index === 0}>
        <summary>Day {current.number} · {current.revised.destination}</summary>
        <div className="journal-revision-comparison">
          <DayDetails label="Original" day={current.original} currency={itinerary.preferences.currency} />
          <DayDetails label="Revised" day={current.revised} currency={preview.itinerary.preferences.currency} />
        </div>
      </details>)}
      {!preview.canSave && <p>This revision is available in this tab. Download a PDF to keep a copy.</p>}
      <div className="journal-revision-actions">
        <div className="journal-revision-secondary">
          <button type="button" className="plan-text" onClick={close} disabled={saving}>Keep original</button>
          <button type="button" className="plan-text" onClick={() => { setPreview(null); resetRequest(); }} disabled={saving}>Edit request</button>
        </div>
        <button type="button" className="plan-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : preview.canSave ? 'Save revision' : 'Use this revision'}</button>
      </div>
    </div> : <form onSubmit={generate} onChange={resetRequest} className="journal-revision-form">
      <fieldset disabled={Boolean(stage)}>
        <legend>What would you like to revise?</legend>
        <div className="journal-revision-scope">
          <label><input type="radio" name="revision-scope" checked={scope === 'day'} onChange={() => setScope('day')} /> One day</label>
          <label><input type="radio" name="revision-scope" checked={scope === 'trip'} onChange={() => setScope('trip')} /> Whole trip</label>
        </div>
        <p>{scope === 'day' ? 'Change activities and transfers within the day’s existing start, end and overnight stay.' : 'Adjust the route, stays or activities within your existing dates and traveller group.'}</p>
        {scope === 'day' && <label>Which day?<select value={day} onChange={event => setDay(Number(event.target.value))}>{itinerary.days.map(option => <option key={option.number} value={option.number}>Day {option.number} · {readCitations(option.destination).text}</option>)}</select></label>}
        <label>Revision goal<select value={goal} onChange={event => setGoal(event.target.value as RevisionGoal)}>
          {!sample && <option value="custom">Describe a change</option>}
          <option value="relaxed">Make it more relaxed</option>
          <option value="interests">Change activity interests</option>
        </select></label>
        {goal === 'interests' && <label><span id="revision-interest-label">Choose an interest</span><select aria-labelledby="revision-interest-label" value={interest} required onChange={event => setInterest(event.target.value)}><option value="">Select an interest</option>{interests.map(([name]) => <option key={name}>{name}</option>)}</select></label>}
        {!sample && <label>{needsNote ? 'What should change?' : 'Anything else? (optional)'}<textarea rows={3} maxLength={600} required={needsNote} value={note} onChange={event => setNote(event.target.value)} placeholder="For example, swap the museum for a spa visit near my hotel." /></label>}
        {!sample && scope === 'trip' && <label>New group budget in {itinerary.preferences.currency} (optional)<input type="text" inputMode="decimal" maxLength={12} value={budget} aria-invalid={Boolean(budgetError)} aria-describedby={budgetError ? 'revision-budget-error' : undefined} onChange={event => setBudget(event.target.value)} />{budgetError && <small id="revision-budget-error">Enter a positive amount.</small>}</label>}
        {sample && <p>Sample mode lets you try pace and interest changes using illustrative activities.</p>}
      </fieldset>
      {stage && <p className="journal-revision-progress" role="status"><LoaderCircle size={16} aria-hidden="true" /> {stage}…</p>}
      <div className="journal-revision-actions"><button type="button" className="plan-text" onClick={close}>Keep original</button><button type="submit" className="plan-primary" disabled={!ready || Boolean(stage)}>Preview changes</button></div>
    </form>}
  </dialog>;
}
