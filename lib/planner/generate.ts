import type { Preferences, Itinerary, Draft } from './model';
import { DayValidationError, finalize, mergeDayRepair } from './validation';
import { compose, repairDay, research, type AiTelemetry } from './provider';
import { loadKnowledge, type KnowledgeEvidence } from '../knowledge/retrieval';

export type GenerationDetails = { itinerary: Itinerary; knowledge: KnowledgeEvidence; repairStages: ('day' | 'full')[] };

export async function generateLiveItinerary(
  preferences: Preferences,
  id: string,
  signal: AbortSignal,
  telemetry?: AiTelemetry,
  onStage?: (stage: string) => Promise<void>,
  frozenKnowledge?: KnowledgeEvidence,
  variant: 'baseline' | 'optimized' = 'optimized',
): Promise<GenerationDetails> {
  const stage = onStage || (async () => {});
  await stage('Checking reviewed Sri Lanka knowledge');
  const knowledge = frozenKnowledge || await loadKnowledge(preferences);
  await stage(knowledge.complete ? 'Using reviewed destinations and connections' : 'Researching missing destinations, stays and transport');
  const evidence = await research(preferences, signal, telemetry, knowledge, variant);
  await stage('Building your day-by-day journey');
  let raw: unknown = await compose(preferences, evidence, signal, undefined, telemetry);
  const repairStages: ('day' | 'full')[] = [];
  try { finalize(raw, preferences, evidence.sources, id, 'live'); }
  catch (error) {
    const message = error instanceof Error ? error.message : 'The itinerary failed validation.';
    if (/^These preferences need another look:|supported costs alone exceed your budget/.test(message)) throw error;
    await stage('Refining the route and timing');
    if (variant === 'optimized' && error instanceof DayValidationError) {
      repairStages.push('day');
      const patch = await repairDay(preferences, evidence, raw as Draft, error.dayNumber, message, signal, telemetry);
      raw = mergeDayRepair(raw, patch.day, error.dayNumber);
      try { finalize(raw, preferences, evidence.sources, id, 'live'); }
      catch (mergedError) {
        const mergedMessage = mergedError instanceof Error ? mergedError.message : 'The repaired itinerary failed validation.';
        if (/^These preferences need another look:|supported costs alone exceed your budget/.test(mergedMessage)) throw mergedError;
        repairStages.push('full');
        raw = await compose(preferences, evidence, signal, { draft: raw, validationError: mergedMessage }, telemetry);
      }
    } else {
      repairStages.push('full');
      raw = await compose(preferences, evidence, signal, { draft: raw, validationError: message }, telemetry);
    }
  }
  await stage('Checking days, connections and cost estimates');
  return { itinerary: finalize(raw, preferences, evidence.sources, id, 'live'), knowledge, repairStages };
}
