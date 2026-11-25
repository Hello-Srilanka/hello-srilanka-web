import { isDeepStrictEqual } from 'node:util';
import { interests, type Draft, type Itinerary, type Preferences } from './model';
import { finalize, mergeDayRepair } from './validation';
import { sampleDraft } from './sample';
import { comparableDay } from './day-comparison';

export const revisionGoals = ['relaxed', 'interests', 'custom'] as const;
export type RevisionGoal = (typeof revisionGoals)[number];
export type RevisionOptions = { dayNumber: number | null; goal: RevisionGoal; interest: string; note: string; budget: string };
export type RevisionPlan = { original: Itinerary; options: RevisionOptions; ownerId: string | null; saveOriginal?: boolean };

export function readRevisionOptions(input: unknown): RevisionOptions {
  if (!input || typeof input !== 'object') throw new Error('Choose what to revise.');
  const { dayNumber, goal, interest, note, budget } = input as Record<string, unknown>;
  if (dayNumber !== null && (typeof dayNumber !== 'number' || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 21)) throw new Error('Choose a day in this itinerary.');
  if (typeof goal !== 'string' || !revisionGoals.some(option => option === goal)) throw new Error('Choose a revision goal.');
  if (typeof note !== 'string' || note.length > 600 || (goal === 'custom' && !note.trim() && !budget)) throw new Error('Describe your request in 600 characters or fewer.');
  if (goal === 'interests' && !interests.some(([name]) => name === interest)) throw new Error('Choose an interest for the revised plan.');
  if (typeof budget !== 'string' || (budget && (dayNumber !== null || !/^\d+(\.\d{1,2})?$/.test(budget) || Number(budget) <= 0 || Number(budget) > 100000000))) throw new Error('Enter a positive group budget for the whole trip, or leave it blank.');
  return { dayNumber, goal: goal as RevisionGoal, interest: goal === 'interests' ? String(interest) : '', note: note.trim(), budget };
}

export function revisionPreferences(original: Itinerary, options: RevisionOptions): Preferences {
  if (options.dayNumber !== null && !original.days.some(day => day.number === options.dayNumber)) throw new Error('Choose a day in this itinerary.');
  if (original.mode === 'sample' && (options.goal === 'custom' || options.note || options.budget)) throw new Error('Sample revisions support changes to pace and activity interests. Custom requests need live research.');
  const p = original.preferences;
  if (options.dayNumber !== null) return p;
  return {
    ...p,
    pace: options.goal === 'relaxed' ? 'Relaxed' : p.pace,
    interests: options.interest ? [...new Set([options.interest, ...p.interests])] : p.interests,
    budget: options.budget || p.budget,
  };
}

export function revisionRequest(options: RevisionOptions) {
  const goal = options.goal === 'relaxed'
    ? 'Reduce the amount of scheduled activity and preserve necessary transfers. Leave room for breaks.'
    : options.interest ? `Prioritise this interest for new activities: ${options.interest}.` : '';
  return { goal, notes: options.note };
}

function originalDraft(original: Itinerary): Draft {
  const { title, summary, assumptions, caveats, conflicts, days } = original;
  return { title, summary, assumptions, caveats, conflicts, days };
}

export function finalizeRevision(plan: RevisionPlan, replacement: unknown, p: Preferences, sources: Itinerary['sources'], id: string): Itinerary {
  const { original, options } = plan;
  const dayNumber = options.dayNumber;
  let draft = replacement;
  if (dayNumber !== null) {
    const revised = replacement as { day?: unknown; summary?: unknown } | null;
    const merged = mergeDayRepair(originalDraft(original), revised?.day, dayNumber);
    const previous = original.days[dayNumber - 1];
    const next = merged.days[dayNumber - 1];
    if (next.startLocation !== previous.startLocation || next.endLocation !== previous.endLocation || next.overnight !== previous.overnight ||
      !isDeepStrictEqual(next.stay, previous.stay)) {
      throw new Error('A one-day revision must keep the same start, end and overnight stay. Try revising the whole trip for a change to the route or hotel.');
    }
    if (options.goal === 'relaxed') {
      const minutes = (day: Itinerary['days'][number]) => day.items.reduce((total, item) => total + (item.durationMinutes ?? (item.kind === 'transport' ? 180 : 60)) + item.bufferMinutes, 0);
      const activities = (day: Itinerary['days'][number]) => day.items.filter(item => item.kind === 'activity').length;
      if (minutes(next) > minutes(previous) || (minutes(next) === minutes(previous) && activities(next) >= activities(previous))) {
        throw new Error('This revision did not make the day lighter. Try removing a specific activity or revising the whole trip.');
      }
    }
    draft = { ...merged, summary: revised?.summary };
  }
  const itinerary = finalize(draft, p, sources, id, original.mode);
  if (isDeepStrictEqual(original.days.map(comparableDay), itinerary.days.map(comparableDay)) && isDeepStrictEqual(p, original.preferences)) {
    throw new Error(`The planner did not find a workable change for this request. ${dayNumber === null ? 'Try a different request.' : 'Try a different activity or choose Whole trip for a change to the route or hotel.'}`);
  }
  return { ...itinerary, revision: { originalId: original.id, dayNumber } };
}

export function reviseSample(plan: RevisionPlan, p: Preferences, id: string): Itinerary {
  const { original, options } = plan;
  const alternative = options.interest ? sampleDraft({ ...p, interests: [options.interest] }) : null;
  const days = original.days.map((day, index) => {
    if (options.dayNumber !== null && day.number !== options.dayNumber) return day;
    const example = alternative?.days[index]?.items.find(item => item.kind === 'activity');
    const items = day.items.map(item => {
      if (item.kind !== 'activity') return item;
      if (options.goal === 'relaxed') return { ...item, durationMinutes: Math.min(item.durationMinutes ?? 60, 45) };
      return example ? { ...item, title: example.title, description: example.description } : item;
    });
    return { ...day, items, highlights: alternative?.days[index]?.highlights ?? day.highlights };
  });
  const draft = { ...originalDraft(original), days };
  const replacement = options.dayNumber === null ? draft : { summary: draft.summary, day: days[options.dayNumber - 1] };
  return finalizeRevision(plan, replacement, p, original.sources, id);
}
