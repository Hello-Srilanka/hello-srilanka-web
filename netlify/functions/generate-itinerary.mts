import { getPlannerJob, claimPlannerJob, updatePlannerJob, validPlannerDispatchToken } from '../../lib/planner/async-job';
import { generateLiveItinerary } from '../../lib/planner/generate';
import type { AiCallMetrics } from '../../lib/planner/provider';

const idPattern = /^[a-f0-9-]{36}$/;

export default async function generateItinerary(request: Request) {
  if (request.method !== 'POST') return;
  let id: string, token: string;
  try {
    const body = await request.text();
    if (body.length > 512) return;
    ({ id, token } = JSON.parse(body));
    if (typeof id !== 'string' || !idPattern.test(id) || typeof token !== 'string') return;
  } catch { return; }

  const existing = await getPlannerJob(id);
  if (!existing || !validPlannerDispatchToken(id, existing.hash, token)) return;
  let job = await claimPlannerJob(id);
  if (!job) return;

  const startedAt = Date.now();
  const metrics: AiCallMetrics[] = [];
  const telemetry = { requestId: id, record: (value: AiCallMetrics) => metrics.push(value) };
  try {
    const stage = async (value: string) => {
      job = { ...job!, stage: value };
      await updatePlannerJob(id, job);
    };
    const result = await generateLiveItinerary(job.preferences, id, AbortSignal.timeout(12 * 60 * 1000), telemetry, stage);
    job = { ...job, status: 'complete', stage: 'Your itinerary is ready', result: result.itinerary };
    await updatePlannerJob(id, job);
  } catch (error) {
    const message = error instanceof Error && /timeout|abort/i.test(error.name + error.message)
      ? 'Planning took too long. Your preferences are still available in this tab.'
      : error instanceof Error ? error.message : 'We could not complete your itinerary. Please retry.';
    job = { ...job, status: 'failed', error: message };
    await updatePlannerJob(id, job);
  } finally {
    if (metrics.length) {
      const total = (key: 'inputTokens' | 'cachedInputTokens' | 'cacheWriteTokens' | 'outputTokens' | 'webSearchCalls') => metrics.reduce((sum, value) => sum + value[key], 0);
      const knownCost = metrics.every(value => value.estimatedCostUsd !== null);
      const cost = metrics.reduce((sum, value) => sum + (value.estimatedCostUsd || 0), 0);
      const durationMs = Date.now() - startedAt;
      console.info(`[AI usage] request_id=${id} stage=total model=${[...new Set(metrics.map(value => value.model))].join('+')} input_tokens=${total('inputTokens')} cached_input_tokens=${total('cachedInputTokens')} cache_write_tokens=${total('cacheWriteTokens')} output_tokens=${total('outputTokens')} web_search_calls=${total('webSearchCalls')} estimated_cost_usd=${knownCost ? cost.toFixed(6) : 'unavailable'} time_ms=${durationMs} time_seconds=${(durationMs / 1000).toFixed(2)}`);
    }
  }
}

export const config = { background: true };
