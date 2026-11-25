import { dayCount, interests, validatePreferences, type Errors, type Preferences } from './model';

export const discoverySteps = ['Nationality', 'Your interests', 'Your pace', 'Your dates', 'Your travellers', 'Personalise', 'Review'];
export const datesStep = 3;
export const travellersStep = 4;
export const personaliseStep = 5;
export const reviewStep = discoverySteps.length - 1;
export const flowVersion = 6;
export const moments = [
  { name: 'Nature', note: 'Tea hills, trails & fresh air', cardImage: '/images/nuwara-tea-country-1200.webp' },
  { name: 'Beaches', note: 'Bare feet & salt air', cardImage: '/images/arugam-fishing-boats-1200.webp' },
  { name: 'Wildlife', note: 'Wildlife & open landscapes', cardImage: '/images/interest-wildlife.webp' },
  { name: 'Scenic journeys', note: 'The journey is the moment', cardImage: '/images/hero-train-1200.webp' },
  { name: 'Food', note: 'Markets, kitchens & good food', cardImage: '/images/interest-food.webp' },
  { name: 'Culture', note: 'Heritage, temples & old towns', cardImage: '/images/sigiriya-1200.webp' },
  { name: 'Adventure', note: 'Surf, hike & head outdoors', cardImage: '/images/interest-adventure.webp' },
  { name: 'Local life', note: 'People, places & small discoveries', cardImage: '/images/interest-local-life.webp' },
  { name: 'Nightlife', note: 'Music & evenings together', cardImage: '/images/interest-nightlife.webp' },
  { name: 'Wellness', note: 'Quiet moments & a little reset', cardImage: '/images/interest-wellness.webp' },
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
  if (step === datesStep || step === travellersStep) {
    const { adults, children, ages, ...dateErrors } = validatePreferences(p, 1);
    if (step === datesStep) return dateErrors;
    const { accessibility } = validatePreferences(p, 3);
    return Object.fromEntries(Object.entries({ adults, children, ages, accessibility }).filter(([, error]) => error));
  }
  if (step === personaliseStep) {
    const { budget, currency, accommodation, transport, mustVisit } = validatePreferences(p, 3);
    return Object.fromEntries(Object.entries({ budget, currency, accommodation, transport, mustVisit }).filter(([, error]) => error));
  }
  return validatePreferences(p);
}
export function restoreDiscoveryStep(step: unknown, version: unknown) {
  if (!Number.isInteger(step)) return 0;
  const n = step as number;
  if (version === flowVersion) return Math.max(0, Math.min(reviewStep, n));
  if (version === 5) return [0, 1, 2, datesStep, travellersStep, reviewStep][n] ?? 0;
  if (version === 4) return [0, 1, 2, datesStep, reviewStep][n] ?? 0;
  if (version === 3) return [1, 2, datesStep, reviewStep][n] ?? 0;
  if (version === 2) return [1, 2, datesStep, reviewStep, reviewStep, reviewStep][n] ?? 0;
  // Previous flow: welcome, basics, interests, combined style, review.
  return [1, datesStep, 1, 2, reviewStep][n] ?? 0;
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
    duration: Number.isInteger(dayCount(p)) && dayCount(p) > 0 && dayCount(p) <= 21 ? `${dayCount(p)} days` : null,
  };
}
