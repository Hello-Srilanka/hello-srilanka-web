import { dayCount, interests, validatePreferences, type Errors, type Preferences } from './model';

export const discoverySteps = ['Nationality', 'Your interests', 'Your pace', 'Your trip', 'Review'];
export const reviewStep = discoverySteps.length - 1;
export const flowVersion = 4;
export const moments = [
  { name: 'Nature', title: 'Lose yourself in the green', note: 'Tea hills, trails & fresh air' },
  { name: 'Beaches', title: 'Let the sea set the pace', note: 'Bare feet & salt air' },
  { name: 'Wildlife', title: 'Meet the wilder island', note: 'Wildlife & open landscapes' },
  { name: 'Scenic journeys', title: 'Watch the hills roll by', note: 'The journey is the moment' },
  { name: 'Food', title: 'Follow the local flavour', note: 'Markets, kitchens & good food' },
  { name: 'Culture', title: 'Step into another story', note: 'Heritage, temples & old towns' },
  { name: 'Adventure', title: 'Find your next rush', note: 'Surf, hike & head outdoors' },
  { name: 'Local life', title: 'Get to know the everyday', note: 'People, places & small discoveries' },
  { name: 'Nightlife', title: 'Stay out a little longer', note: 'Music & evenings together' },
  { name: 'Wellness', title: 'Make room to breathe', note: 'Quiet moments & a little reset' },
].map(m => ({ ...m, image: interests.find(([name]) => name === m.name)![1] }));
export const rhythms = [
  { value: 'Relaxed', title: 'Take it slow', note: 'One lovely thing. Time to linger.', beats: ['A slow breakfast', 'One good outing', 'An afternoon that’s yours'], mood: 'Room to slow down.' },
  { value: 'Balanced', title: 'A little of everything', note: 'Discover a little. Drift a little.', beats: ['A morning discovery', 'Lunch with a local flavour', 'A little sunset wandering'], mood: 'A little discovery. A little daydream.' },
  { value: 'Packed', title: 'Keep exploring', note: 'Early starts. Full hearts.', beats: ['Out with the early light', 'A few different experiences', 'An evening to remember'], mood: 'Days full of discovery.' },
] as const;
export function discoveryErrors(p: Preferences, step: number): Errors {
  if (step === 0) return validatePreferences(p, 0);
  if (step === 1) return validatePreferences(p, 2);
  if (step === 2) return Object.fromEntries(Object.entries(validatePreferences(p, 3)).filter(([k]) => k === 'pace'));
  if (step === 3) return { ...validatePreferences(p, 1), ...Object.fromEntries(Object.entries(validatePreferences(p, 3)).filter(([k]) => k === 'accessibility')) };
  return validatePreferences(p);
}
export function restoreDiscoveryStep(step: unknown, version: unknown) {
  if (!Number.isInteger(step)) return 0;
  const n = step as number;
  if (version === flowVersion) return Math.max(0, Math.min(reviewStep, n));
  if (version === 3) return [1, 2, 3, reviewStep][n] ?? 0;
  if (version === 2) return [1, 2, 3, reviewStep, reviewStep, reviewStep][n] ?? 0;
  // Previous flow: welcome, basics, interests, combined style, review.
  return [1, 3, 1, 2, reviewStep][n] ?? 0;
}
const feeling: Record<string, string> = {
  Nature: 'Green escapes', Beaches: 'Salt-air days', Wildlife: 'Wild encounters', Adventure: 'A little adventure',
  Food: 'Local flavours', Culture: 'Island stories', 'Local life': 'Everyday discoveries', Nightlife: 'Lively evenings',
  Wellness: 'Quiet moments', 'Scenic journeys': 'Scenic journeys',
};
export function journeyStory(p: Preferences) {
  const chosen = p.interests.slice(0, 3).map(i => feeling[i]).filter(Boolean);
  const rhythm = rhythms.find(r => r.value === p.pace) || rhythms[1];
  return { title: chosen.length ? chosen.join('. ') + '.' : 'A little island. A thousand possibilities.',
    description: chosen.length ? rhythm.mood : 'Pick the moments you love. See your Sri Lanka take shape.',
    duration: Number.isInteger(dayCount(p)) && dayCount(p) > 0 && dayCount(p) <= 21 ? `${dayCount(p)} days` : null,
  };
}
