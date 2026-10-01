import { createClient } from '@supabase/supabase-js';
import { dayCount, dayDate, months, type Preferences, type Source } from '../planner/model';
import { safeUrl } from '../planner/validation';
import { supabaseConfig, supabaseConfigured } from '../supabase/config';
import type { KnowledgeRecord } from './model';

export type KnowledgeEvidence = { text: string; sources: Source[]; complete: boolean };
const empty: KnowledgeEvidence = { text: '', sources: [], complete: false };
const key = (value: string) => value.trim().toLowerCase();

function travelMonths(p: Preferences) {
  if (p.undecided) {
    const index = months.indexOf(p.month);
    return index > 0 ? new Set([index]) : new Set<number>();
  }
  return new Set(Array.from({ length: dayCount(p) }, (_, day) => Number(dayDate(p, day)?.slice(5, 7))));
}

function currentForTrip(record: KnowledgeRecord, selectedMonths: Set<number>) {
  return !record.months.length || (selectedMonths.size > 0 && record.months.some(month => selectedMonths.has(month)));
}

export async function loadKnowledge(p: Preferences): Promise<KnowledgeEvidence> {
  if (!supabaseConfigured()) return empty;
  try {
    const { url, key: publishableKey } = supabaseConfig();
    const supabase = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    });
    const { data, error } = await supabase.from('knowledge_records').select('*').eq('status', 'approved').order('reviewed_at', { ascending: false }).limit(400);
    if (error) { console.warn('[knowledge] approved records unavailable:', error.code || 'query_failed'); return empty; }
    return selectKnowledge(p, (data || []) as KnowledgeRecord[]);
  } catch { console.warn('[knowledge] approved records unavailable: connection_failed'); return empty; }
}

export function selectKnowledge(p: Preferences, records: KnowledgeRecord[], now = Date.now()): KnowledgeEvidence {
  const tripMonths = travelMonths(p);
  const all = records.filter(record => record.status === 'approved' && Boolean(record.expires_at) && Date.parse(record.expires_at!) > now && safeUrl(record.source_url) && currentForTrip(record, tripMonths));
  const wanted = new Set(p.interests);
  const places = [...new Set(all.filter(record => record.kind !== 'connection').map(record => record.destination))];
  const ranked = places.map(place => ({
    name: place,
    score: all.filter(record => key(record.destination) === key(place) && record.kind === 'activity' && (!record.interests.length || record.interests.some(tag => wanted.has(tag)))).length * 2
      + all.filter(record => key(record.destination) === key(place) && record.kind === 'stay').length
      + (p.mustVisit.toLowerCase().includes(place.toLowerCase()) ? 10 : 0),
  })).sort((a, b) => b.score - a.score).slice(0, Math.min(6, Math.max(2, Math.ceil(dayCount(p) / 4))));
  const selectedPlaces = new Set(ranked.map(place => key(place.name)));
  const selected = all.filter(record => record.kind === 'connection'
    ? (selectedPlaces.has(key(record.destination)) || key(record.destination) === key(p.arrival))
      && (selectedPlaces.has(key(record.related_destination || '')) || key(record.related_destination || '') === key(p.departure))
    : selectedPlaces.has(key(record.destination)) && (record.kind !== 'activity' || !record.interests.length || record.interests.some(tag => wanted.has(tag))));
  const counts = new Map<string, number>();
  const limited = selected.filter(record => {
    const id = `${key(record.destination)}:${record.kind}`;
    const count = counts.get(id) || 0;
    const limit = record.kind === 'activity' ? Math.min(22, dayCount(p) + 3) : record.kind === 'stay' ? 2 : 4;
    if (count >= limit) return false;
    counts.set(id, count + 1);
    return true;
  }).slice(0, 90);
  if (!limited.length) return empty;
  // Skip live search only for a well-supported, single-base route with both airport links.
  const completeBase = dayCount(p) >= 2 && !p.mustVisit.trim() && !p.accessibility.trim() && p.children === 0 && p.transport === 'Help me decide' && p.accommodation === 'Help me decide' && ranked.find(place => {
    const area = key(place.name);
    const records = limited.filter(record => key(record.destination) === area);
    const activities = records.filter(record => record.kind === 'activity').length;
    const stay = records.some(record => record.kind === 'stay' && record.provider_url);
    const season = records.some(record => record.kind === 'season');
    const arrival = limited.some(record => record.kind === 'connection' && key(record.destination) === key(p.arrival) && key(record.related_destination || '') === area);
    const departure = limited.some(record => record.kind === 'connection' && key(record.destination) === area && key(record.related_destination || '') === key(p.departure));
    return activities >= dayCount(p) - 1 && stay && season && arrival && departure;
  });
  const base = completeBase ? key(completeBase.name) : null;
  const included = base ? limited.filter(record => key(record.destination) === base || record.kind === 'connection' && key(record.destination) === key(p.arrival) && key(record.related_destination || '') === base) : limited;
  const sourceIds = new Map(included.map((record, index) => [record.id, `k${index + 1}`]));
  const sources: Source[] = included.map(record => ({ id: sourceIds.get(record.id)!, title: record.title, url: record.source_url, retrievedAt: record.retrieved_at }));
  const lines = included.map(record => {
    const context = `${record.kind}; ${record.destination}${record.related_destination ? ` → ${record.related_destination}` : ''}; ${record.title}`;
    const period = record.months.length ? `; months ${record.months.join(', ')}` : '';
    const duration = record.duration_minutes ? `; suggested ${record.duration_minutes} minutes` : '';
    return `- ${context}${period}${duration}: ${record.claim} [${sourceIds.get(record.id)}]`;
  });
  return { text: `Approved Sri Lanka knowledge (use each source ID only for the claim directly before it):\n${lines.join('\n')}`, sources, complete: Boolean(completeBase) };
}
