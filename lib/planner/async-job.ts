import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Itinerary, Preferences } from './model';

export type PlannerJob = {
  hash: string;
  createdAt: number;
  startedAt?: number;
  stage: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  preferences: Preferences;
  result?: Itinerary;
  error?: string;
};

export const plannerJobTtl = 24 * 60 * 60 * 1000;
export const asyncPlannerAvailable = () => Boolean((process.env.SITE_ID || process.env.NETLIFY_SITE_ID) && process.env.OPENAI_API_KEY);
export const plannerJobStore = () => getStore({ name: 'hellosrilanka-planner-jobs', consistency: 'strong' });

export async function getPlannerJob(id: string): Promise<PlannerJob | null> {
  return (await plannerJobStore().get(id, { type: 'json' })) as PlannerJob | null;
}

export async function createPlannerJob(id: string, job: PlannerJob): Promise<boolean> {
  return (await plannerJobStore().setJSON(id, job, { onlyIfNew: true, metadata: { expiresAt: job.createdAt + plannerJobTtl } })).modified;
}

export async function updatePlannerJob(id: string, job: PlannerJob): Promise<void> {
  await plannerJobStore().setJSON(id, job, { metadata: { expiresAt: job.createdAt + plannerJobTtl } });
}

export async function claimPlannerJob(id: string): Promise<PlannerJob | null> {
  const store = plannerJobStore();
  const current = await store.getWithMetadata(id, { type: 'json' });
  if (!current?.etag) return null;
  const job = current.data as PlannerJob;
  if (job.status !== 'queued') return null;
  const running: PlannerJob = { ...job, status: 'running', startedAt: Date.now() };
  const claimed = await store.setJSON(id, running, { onlyIfMatch: current.etag, metadata: { expiresAt: job.createdAt + plannerJobTtl } });
  return claimed.modified ? running : null;
}

export function plannerDispatchToken(id: string, hash: string): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('The live planner is not configured.');
  return createHmac('sha256', key).update(`${id}:${hash}`).digest('hex');
}

export function validPlannerDispatchToken(id: string, hash: string, token: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = Buffer.from(plannerDispatchToken(id, hash), 'hex');
  return timingSafeEqual(expected, Buffer.from(token, 'hex'));
}
