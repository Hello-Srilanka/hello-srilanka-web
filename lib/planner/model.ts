export const interests = [
  ['Nature', 'nuwara-tea-country', 'Green hills & wide-open spaces'],
  ['Beaches', 'arugam-fishing-boats', 'Salt air & slower days'],
  ['Wildlife', 'elephants-udawalawe', 'A little closer to the wild'],
  ['Adventure', 'surf-hiriketiya', 'Find your next rush'],
  ['Food', 'food-vendor', 'Taste your way around'],
  ['Culture', 'sigiriya', 'Stories carved in stone'],
  ['Local life', 'market-life', 'Meet the everyday island'],
  ['Nightlife', 'galle-lighthouse', 'Stay out after sunset'],
  ['Wellness', 'negombo-sunset', 'Make room to reset'],
  ['Scenic journeys', 'hero-train', 'The journey is the moment'],
] as const;
export const transports = ['Help me decide', 'Private driver', 'Train & driver', 'Public transport', 'Self-drive'] as const;
export const stays = ['Help me decide', 'Boutique hotels', 'Resorts', 'Guesthouses', 'Luxury hotels'] as const;
export const currencies = ['USD', 'GBP', 'EUR', 'LKR', 'AUD', 'INR'] as const;
export const months = ['Any month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export type Preferences = {
  undecided: boolean; arrivalDate: string; departureDate: string; duration: number; month: string;
  arrival: string; departure: string; arrivalTime: string; departureTime: string;
  adults: number; children: number; ages: string[]; interests: string[];
  pace: 'Relaxed' | 'Balanced' | 'Packed'; budget: string; currency: string;
  budgetBasis: 'group' | 'person'; transport: string; accommodation: string;
  mustVisit: string; accessibility: string;
};
export const defaults: Preferences = {
  undecided: false, arrivalDate: '', departureDate: '', duration: 7, month: 'Any month',
  arrival: 'Bandaranaike International Airport (CMB)', departure: 'Bandaranaike International Airport (CMB)',
  arrivalTime: '', departureTime: '', adults: 2, children: 0, ages: [], interests: [],
  pace: 'Balanced', budget: '', currency: 'USD', budgetBasis: 'group',
  transport: 'Help me decide', accommodation: 'Help me decide', mustVisit: '', accessibility: '',
};
export function dayCount(p: Preferences) {
  return p.undecided ? p.duration : Math.round((Date.parse(p.departureDate) - Date.parse(p.arrivalDate)) / 86400000) + 1;
}
export function dayTimeBudgets(p: Preferences) {
  const count = dayCount(p);
  const windows = [[0, 12 * 60], [12 * 60, 18 * 60], [18 * 60, 24 * 60]];
  return Array.from({ length: count }, (_, index) => {
    const earlyDeparture = index === count - 1 && Boolean(p.departureTime && p.departureTime < '11:00');
    const arrival = index === 0 && p.arrivalTime
      ? Number(p.arrivalTime.slice(0, 2)) * 60 + Number(p.arrivalTime.slice(3)) + 90
      : earlyDeparture ? 0 : 8 * 60;
    const departure = index === count - 1 && p.departureTime
      ? Number(p.departureTime.slice(0, 2)) * 60 + Number(p.departureTime.slice(3)) - 180
      : 22 * 60;
    const periods = windows.map(([start, end]) => Math.max(0, Math.min(end, departure) - Math.max(start, arrival)));
    return {
      day: index + 1,
      morningMinutes: periods[0],
      afternoonMinutes: periods[1],
      eveningMinutes: periods[2],
      totalMinutes: Math.max(0, departure - arrival),
    };
  });
}
export function normalizePreferences(p: Preferences): Preferences {
  if (p.undecided) return { ...p, arrivalDate: '', departureDate: '' };
  const calculatedDuration = dayCount(p);
  return { ...p, duration: Number.isInteger(calculatedDuration) ? calculatedDuration : p.duration, month: 'Any month' };
}
export function itineraryRequestPreferences(p: Preferences) {
  const { undecided, arrivalDate, departureDate, duration, month, ...shared } = p;
  return {
    ...shared,
    datePlan: undecided
      ? { mode: 'flexible' as const, durationDays: duration, preferredMonth: month }
      : { mode: 'fixed' as const, arrivalDate, departureDate, dayCount: dayCount(p) },
  };
}
export function dayDate(p: Preferences, index: number) {
  if (p.undecided) return null;
  return new Date(Date.parse(p.arrivalDate) + index * 86400000).toISOString().slice(0, 10);
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
export function tripDates(p: Preferences) {
  return p.undecided ? `${p.duration} days · ${p.month === 'Any month' ? 'Dates to be decided' : p.month + ' preferred'}` : `${dateLabel(p.arrivalDate)} — ${dateLabel(p.departureDate)}`;
}
export function travellers(p: Preferences) { return `${p.adults} adult${p.adults === 1 ? '' : 's'}${p.children ? ` · ${p.children} child${p.children === 1 ? '' : 'ren'}` : ''}`; }
export function money(amount: number, currency: string) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount); }
export function groupBudget(p: Preferences) { return p.budget ? Number(p.budget) * (p.budgetBasis === 'person' ? p.adults + p.children : 1) : null; }
export type Errors = Record<string, string>;
export function validatePreferences(p: Preferences, step?: number): Errors {
  const e: Errors = {};
  if (step === undefined || step === 1) {
    if (!p.undecided) {
      const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
      if (!validDate(p.arrivalDate)) e.arrivalDate = 'Choose a valid arrival date.';
      if (!validDate(p.departureDate)) e.departureDate = 'Choose a valid departure date.';
      if (!e.arrivalDate && p.arrivalDate < new Date().toISOString().slice(0, 10)) e.arrivalDate = 'Choose today or a future arrival date.';
      if (!e.departureDate && !e.arrivalDate && dayCount(p) < 1) e.departureDate = 'Departure must be on or after arrival.';
      if (p.arrivalDate === p.departureDate && p.arrivalTime && p.departureTime && p.arrivalTime >= p.departureTime) e.departureTime = 'Departure must be after arrival.';
    }
    if (!Number.isInteger(dayCount(p)) || dayCount(p) < 1 || dayCount(p) > 21) e.duration = 'For this release, choose a trip of 1–21 days, including arrival and departure.';
    if (!months.includes(p.month)) e.month = 'Choose a preferred month.';
    for (const k of ['arrival', 'departure'] as const) if (!p[k].trim() || p[k].length > 160) e[k] = 'Enter a location (up to 160 characters).';
    for (const k of ['arrivalTime', 'departureTime'] as const) if (p[k] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p[k])) e[k] = 'Enter a valid local flight time.';
    if (!Number.isInteger(p.adults) || p.adults < 1 || p.adults > 12) e.adults = 'Choose 1–12 adults.';
    if (!Number.isInteger(p.children) || p.children < 0 || p.children > 8) e.children = 'Choose 0–8 children.';
    if (p.ages.length !== p.children || p.ages.some(a => !/^\d{1,2}$/.test(a) || Number(a) > 17)) e.ages = 'Enter each child’s age from 0 to 17.';
  }
  if (step === undefined || step === 2) {
    if (!p.interests.length || p.interests.some(i => !interests.some(([name]) => name === i)) || new Set(p.interests).size !== p.interests.length) e.interests = 'Choose at least one interest.';
  }
  if (step === undefined || step === 3) {
    if (!['Relaxed', 'Balanced', 'Packed'].includes(p.pace)) e.pace = 'Choose your pace.';
    if (p.budget && (!/^\d+(\.\d{1,2})?$/.test(p.budget) || Number(p.budget) <= 0 || Number(p.budget) > 100000000)) e.budget = 'Enter a positive amount, or leave blank for help deciding.';
    if (!(currencies as readonly string[]).includes(p.currency)) e.currency = 'Choose a supported currency.';
    if (!['group', 'person'].includes(p.budgetBasis)) e.budgetBasis = 'Choose who the budget covers.';
    if (!(transports as readonly string[]).includes(p.transport)) e.transport = 'Choose a transport preference.';
    if (!(stays as readonly string[]).includes(p.accommodation)) e.accommodation = 'Choose a stay preference.';
    if (p.mustVisit.length > 600) e.mustVisit = 'Use up to 600 characters.';
    if (p.accessibility.length > 600) e.accessibility = 'Use up to 600 characters.';
  }
  return e;
}
export function readPreferences(value: unknown): Preferences {
  if (!value || typeof value !== 'object') throw new Error('Your preferences could not be read. Please review the form.');
  const p = value as Record<string, unknown>;
  for (const [key, base] of Object.entries(defaults)) {
    if (Array.isArray(base)) {
      if (!Array.isArray(p[key]) || (p[key] as unknown[]).some(v => typeof v !== 'string') || (p[key] as unknown[]).length > 20) throw new Error('Invalid preference format.');
    } else if (typeof p[key] !== typeof base) throw new Error('Invalid preference format.');
  }
  return normalizePreferences(Object.fromEntries(Object.keys(defaults).map(k => [k, p[k]])) as Preferences);
}
export type Source = { id: string; title: string; url: string; retrievedAt: string | null };
export type Cost = { amount: number | null; basis: string; sourceIds: string[] };
export type Item = {
  kind: 'activity' | 'transport'; title: string; description: string; period: 'Morning' | 'Afternoon' | 'Evening';
  from: string; to: string; durationMinutes: number | null; bufferMinutes: number; sourceIds: string[]; cost: Cost;
};
export type Day = {
  number: number; destination: string; startLocation: string; endLocation: string; overnight: string | null;
  highlights: string; items: Item[];
  stay: { name: string; description: string; sourceId: string | null; cost: Cost } | null;
};
export type Draft = { title: string; summary: string; assumptions: string[]; caveats: string[]; conflicts: string[]; days: Day[] };
export type Itinerary = Draft & { version: 1; id: string; mode: 'sample' | 'live'; generatedAt: string; preferences: Preferences; sources: Source[]; knownCost: number | null; unknownCosts: string[] };
export const unknownCost = (): Cost => ({ amount: null, basis: 'Check price and availability', sourceIds: [] });
