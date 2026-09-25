'use client';
/* eslint-disable react-hooks/set-state-in-effect -- Restore device-local state only after hydration. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Compass, ArrowUpRight } from 'lucide-react';
import { defaults, validatePreferences, type Preferences, type Itinerary, type Errors } from '@/lib/planner/model';
import PlanningForm from './PlanningForm';
import { discoveryErrors, reviewStep } from '@/lib/planner/discovery';
import ItineraryView from './ItineraryView';
import { isPristinePlannerSession, legacyPlannerStorageKey, parsePlannerSession, plannerSessionKey, plannerSessionTtl, serializePlannerSession, type PlannerSession } from '@/lib/planner/session';
type Screen = 'form' | 'generating' | 'result';
export default function Planner() {
  const [p, setP] = useState<Preferences>(defaults);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [editing, setEditing] = useState(false);
  const [screen, setScreen] = useState<Screen>('form');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [ready, setReady] = useState(false);
  const [storageNote, setStorageNote] = useState('');
  const [mode, setMode] = useState('checking');
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [stages, setStages] = useState<string[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const busy = useRef(false);
  const activeController = useRef<AbortController | null>(null);
  useEffect(() => {
    try { localStorage.removeItem(legacyPlannerStorageKey); }
    catch { setStorageNote('An older saved draft could not be removed. Clear this site’s browser data to remove it manually.'); }
    try {
      const raw = sessionStorage.getItem(plannerSessionKey);
      if (raw) {
        const data = parsePlannerSession(raw);
        if (!data) sessionStorage.removeItem(plannerSessionKey);
        else {
          setP(data.preferences); setStep(data.step); setFurthest(data.furthest); setEditing(data.editing); setRequestId(data.requestId);
          if (data.screen === 'generating') { setScreen('form'); setFailure('Your last request may still be finishing. Choose “Create my itinerary” to reconnect safely.'); }
        }
      }
    } catch {
      try { sessionStorage.removeItem(plannerSessionKey); } catch { /* Storage may be unavailable. */ }
      setStorageNote('Your temporary draft could not be restored. You can still plan a new trip.');
    }
    setReady(true);
    fetch('/api/itinerary', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => setMode(data.mode === 'live' ? 'live' : 'sample')).catch(() => { setMode('unavailable'); setFailure('The planning service is unavailable. You can fill out your preferences and try again shortly.'); });
    return () => activeController.current?.abort();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const state: PlannerSession = { preferences: p, step, furthest, editing, screen: screen === 'generating' ? 'generating' : 'form', requestId };
    try {
      if (screen === 'result' || isPristinePlannerSession(state)) sessionStorage.removeItem(plannerSessionKey);
      else sessionStorage.setItem(plannerSessionKey, serializePlannerSession(state));
    } catch { setStorageNote('Temporary draft storage is unavailable. Keep this tab open until your itinerary is ready.'); }
    if (screen === 'result' || isPristinePlannerSession(state)) return;
    const expiry = window.setTimeout(() => { try { sessionStorage.removeItem(plannerSessionKey); } catch { /* Storage may be unavailable. */ } }, plannerSessionTtl);
    return () => window.clearTimeout(expiry);
  }, [ready, p, step, furthest, editing, screen, requestId]);
  function focusHeading() { requestAnimationFrame(() => { document.querySelector<HTMLElement>('#step-heading, #result-heading, #generation-heading')?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }); }
  function go(s: number) {
    setEditing(step === reviewStep && s < reviewStep ? true : s === reviewStep ? false : editing);
    setStep(s); setFurthest(old => Math.max(old, s)); setErrors({}); setFailure(''); focusHeading();
  }
  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setP(old => ({ ...old, [key]: value, ...(key === 'children' ? { ages: Array.from({ length: value as number }, (_, i) => old.ages[i] ?? '') } : {}) }));
    setRequestId(null); setErrors(old => { const copy = { ...old }; delete copy[key]; return copy; });
  }
  function next() {
    const e = discoveryErrors(p, step); setErrors(e);
    if (Object.keys(e).length) { requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    go(editing ? reviewStep : step + 1);
  }
  async function generate() {
    if (busy.current) return;
    const e = validatePreferences(p); setErrors(e);
    if (Object.keys(e).length) {
      const invalidStep = Array.from({ length: reviewStep }, (_, i) => i).find(i => Object.keys(discoveryErrors(p, i)).length) ?? 0;
      setStep(invalidStep); setEditing(true); setErrors(discoveryErrors(p, invalidStep));
      setFailure('Please correct these details before creating your itinerary.'); focusHeading(); return;
    }
    busy.current = true; setFailure(''); setScreen('generating'); setStages(['Connecting to your planner']); focusHeading();
    const id = requestId || crypto.randomUUID(); setRequestId(id);
    const controller = new AbortController(); activeController.current = controller;
    const timeout = setTimeout(() => controller.abort(), 230000);
    try {
      // Write the id synchronously before the network call so refresh reconnects to it.
      try { sessionStorage.setItem(plannerSessionKey, serializePlannerSession({ preferences: p, step: reviewStep, furthest: reviewStep, editing: false, screen: 'generating', requestId: id })); } catch { /* The visible storage warning is handled by the persistence effect. */ }
      const response = await fetch('/api/itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, preferences: p }), signal: controller.signal });
      if (!response.ok) { const data = await response.json(); if (response.status === 400 || response.status === 409) setRequestId(null); throw new Error(data.error || 'Planning is unavailable. Please retry.'); }
      if (!response.body) throw new Error('No response was received. Please retry to reconnect.');
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '', complete = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.mode) setMode(event.mode);
        if (event.stage) setStages(old => old.includes(event.stage) ? old : [...old, event.stage]);
        if (event.error) { if (event.terminal) setRequestId(null); throw new Error(event.error); }
        if (event.result) { try { sessionStorage.removeItem(plannerSessionKey); } catch { /* Storage may be unavailable. */ } setItinerary(event.result); setScreen('result'); setRequestId(null); complete = true; focusHeading(); }
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) { buffer += decoder.decode(); if (buffer.trim()) consume(buffer); break; }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop() || ''; lines.forEach(consume);
      }
      if (!complete) throw new Error('The connection ended early. Retry to reconnect to the same request.');
    } catch (error) {
      setFailure(error instanceof Error && error.name === 'AbortError' ? 'The connection timed out. Your preferences are kept temporarily in this tab. Retry to reconnect safely.' : error instanceof Error ? error.message : 'Something went wrong. Please retry.');
      setScreen('form'); setStep(reviewStep); setFurthest(reviewStep); focusHeading();
    } finally { clearTimeout(timeout); activeController.current = null; busy.current = false; }
  }
  function newTrip() { try { sessionStorage.removeItem(plannerSessionKey); } catch { /* Storage may be unavailable. */ } setP({ ...defaults }); setStep(0); setFurthest(0); setEditing(false); setScreen('form'); setErrors({}); setFailure(''); setRequestId(null); focusHeading(); }
  return <div className="planner-app"><header className="planner-header"><Link className="wordmark" href="/" aria-label="HelloSriLanka home">hello<span>srilanka</span><span className="brand-period">.</span></Link><span className="planner-brand-promise">YOUR SRI LANKA. YOUR WAY.</span><Link href="/account" className="planner-home">Account</Link><Link href="/" className="planner-home"><ArrowLeft size={15} /><span>Back to the island</span></Link></header>
    <main id="main">
      {storageNote && <div className="storage-notice" role="status">{storageNote}</div>}
      {mode === 'sample' && screen !== 'result' && <div className="sample-banner"><span>Sample mode</span> Explore the planner with an illustrative itinerary. Live research is not connected.</div>}
      {!ready ? <div className="planner-initial" role="status">Getting your journey ready…</div> : screen === 'result' && itinerary ? <ItineraryView itinerary={itinerary} newTrip={newTrip} /> : screen === 'generating' ? <section className="generation-screen"><div className="generation-symbol"><Compass size={52} strokeWidth={1} /></div><p className="eyebrow">A JOURNEY WORTH MAKING YOURS</p><h1 id="generation-heading" tabIndex={-1}>{mode === 'sample' ? 'A glimpse of your Sri Lanka.' : 'Connecting the dots.'}</h1><p>{mode === 'sample' ? 'Preparing an illustrative journey so you can explore the experience.' : 'Thoughtful journeys take a little research. We’re finding the places and connections that fit your plans.'}</p><ol className="generation-stages" aria-live="polite">{stages.map((s, i) => <li key={s}>{i < stages.length - 1 ? <Check size={17} /> : <span className="stage-dot" />}<span>{s}</span></li>)}</ol><p className="small-note">Your answers are kept temporarily in this tab. If you refresh, you can reconnect from the review screen.</p></section> : <>{failure && <div className="planner-failure" role="alert"><strong>Let’s give that another look.</strong><p>{failure}</p>{mode === 'unavailable' && <button className="plan-text" onClick={() => window.location.reload()}>Check connection <ArrowUpRight size={16} /></button>}</div>}<PlanningForm p={p} step={step} furthest={furthest} editing={editing} errors={errors} update={update} go={go} next={next} generate={generate} mode={mode} saved={!!itinerary} resume={() => { setScreen('result'); focusHeading(); }} /></>}
    </main><footer className="planner-footer"><span>hello<span>srilanka</span>.</span><p>A little island. An endless feeling.</p></footer>
  </div>;
}
