import type { Itinerary, Preferences } from './model';
import type { RevisionOptions } from './revision';

type PlannerRequest = { id: string } & ({ preferences: Preferences } | { revision: { originalId: string; proof: string; options: RevisionOptions } });
type PlannerEvent = { mode?: string; stage?: string; error?: string; terminal?: boolean; result?: Itinerary; history?: string; status?: string; canSave?: boolean };
type CompletedPlan = { itinerary: Itinerary; history: 'guest' | 'saved' | 'failed'; canSave: boolean };

export class PlannerRequestError extends Error {
  constructor(message: string, readonly finished: boolean) { super(message); }
}

export async function requestPlan(body: PlannerRequest, signal: AbortSignal, onProgress: (event: PlannerEvent) => void): Promise<CompletedPlan> {
  const response = await fetch('/api/itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new PlannerRequestError(data.error || 'Planning is unavailable. Please retry.', [400, 401, 404, 409, 410].includes(response.status));
  }
  const state: { completed?: CompletedPlan } = {};
  const consume = (event: PlannerEvent) => {
    if (event.error) throw new PlannerRequestError(event.error, Boolean(event.terminal));
    onProgress(event);
    if (event.result) state.completed = {
      itinerary: event.result,
      history: event.history === 'saved' || event.history === 'failed' ? event.history : 'guest',
      canSave: Boolean(event.canSave),
    };
  };

  if (response.status === 202) {
    const job = await response.json() as PlannerEvent & { dispatchToken: string };
    consume(job);
    let dispatchFailures = 0;
    const dispatch = async () => {
      // A lost response can still mean the worker accepted the job. Poll for its status.
      try {
        const started = await fetch('/.netlify/functions/generate-itinerary', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: body.id, token: job.dispatchToken }), signal,
        });
        if (started.status === 404 || started.status === 405) throw new Error('The planner worker is not available on this deployment. Please try again later.');
        if (!started.ok) throw new Error('The planner worker could not start.');
        dispatchFailures = 0;
      } catch (error) {
        if (signal.aborted || (error instanceof Error && error.message.includes('not available on this deployment'))) throw error;
        if (++dispatchFailures >= 3) throw new Error('The planner could not start. Please retry to reconnect.');
        onProgress({ stage: 'Reconnecting to your planner' });
      }
    };
    let lastDispatch = Date.now();
    if (job.status === 'queued') await dispatch();
    let failures = 0;
    while (!state.completed) {
      await new Promise(resolve => setTimeout(resolve, 2500));
      signal.throwIfAborted();
      let event: PlannerEvent;
      try {
        const status = await fetch(`/api/itinerary?id=${encodeURIComponent(body.id)}`, { cache: 'no-store', signal });
        if (status.status === 404 || status.status === 410) {
          const data = await status.json();
          throw new PlannerRequestError(data.error || 'This planning request has expired. Please start it again.', true);
        }
        if (!status.ok) throw new TypeError('The planner status is temporarily unavailable.');
        event = await status.json() as PlannerEvent;
      } catch (error) {
        if (signal.aborted || !(error instanceof TypeError)) throw error;
        if (++failures > 5) throw new Error('The connection to your planner was lost. Retry to reconnect.');
        continue;
      }
      failures = 0;
      consume(event);
      if (!state.completed && event.status === 'queued' && Date.now() - lastDispatch > 15000) {
        lastDispatch = Date.now();
        await dispatch();
      }
    }
  } else {
    if (!response.body) throw new Error('No response was received. Please retry to reconnect.');
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) { buffer += decoder.decode(); if (buffer.trim()) consume(JSON.parse(buffer)); break; }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.filter(Boolean).forEach(line => consume(JSON.parse(line)));
      }
    } finally { reader.releaseLock(); }
  }
  if (!state.completed) throw new Error('The connection ended early. Retry to reconnect to the same request.');
  return state.completed;
}
