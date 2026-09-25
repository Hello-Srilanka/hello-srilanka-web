import { interests } from '@/lib/planner/model';
import { safeUrl } from '@/lib/planner/validation';

export const knowledgeKinds = ['destination', 'activity', 'stay', 'connection', 'season'] as const;
export type KnowledgeKind = typeof knowledgeKinds[number];
export type KnowledgeStatus = 'draft' | 'approved' | 'archived';
export type KnowledgeRecord = {
  id: string; kind: KnowledgeKind; title: string; destination: string; related_destination: string | null;
  interests: string[]; months: number[]; duration_minutes: number | null; claim: string;
  source_url: string; provider_url: string | null; status: KnowledgeStatus;
  retrieved_at: string | null; reviewed_at: string | null; reviewed_by: string | null;
  expires_at: string | null; created_at: string; updated_at: string; version: number;
};
const allowedInterests = new Set<string>(interests.map(([name]) => name));

export function parseKnowledgeForm(form: FormData) {
  const kind = String(form.get('kind') || '') as KnowledgeKind;
  const title = String(form.get('title') || '').trim();
  const destination = String(form.get('destination') || '').trim();
  const related = String(form.get('related_destination') || '').trim();
  const claim = String(form.get('claim') || '').trim();
  const sourceUrl = String(form.get('source_url') || '').trim();
  const providerUrl = String(form.get('provider_url') || '').trim();
  const interestTags = form.getAll('interests').map(String);
  const monthValues = form.getAll('months').map(Number);
  const durationValue = String(form.get('duration_minutes') || '').trim();
  const duration = durationValue ? Number(durationValue) : null;
  if (!knowledgeKinds.includes(kind)) throw new Error('Choose a record type.');
  if (!title || title.length > 140 || !destination || destination.length > 140) throw new Error('Add a title and destination (up to 140 characters each).');
  if (related.length > 140 || (kind === 'connection' && !related)) throw new Error('Connections need a destination at each end.');
  if (claim.length < 10 || claim.length > 800) throw new Error('Write one sourced fact (10–800 characters).');
  if (!safeUrl(sourceUrl) || sourceUrl.length > 1000 || (providerUrl && (!safeUrl(providerUrl) || providerUrl.length > 1000))) throw new Error('Use valid HTTPS source and provider URLs.');
  if (kind === 'stay' && (!providerUrl || providerUrl !== sourceUrl)) throw new Error('For a stay, use its direct provider page as both the source and provider URL.');
  if (interestTags.some(tag => !allowedInterests.has(tag)) || monthValues.some(month => !Number.isInteger(month) || month < 1 || month > 12)) throw new Error('Choose valid interests and months.');
  if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 720)) throw new Error('Duration must be 1–720 minutes.');
  return { kind, title, destination, related_destination: related || null, interests: interestTags, months: monthValues, duration_minutes: duration, claim, source_url: sourceUrl, provider_url: providerUrl || null };
}
