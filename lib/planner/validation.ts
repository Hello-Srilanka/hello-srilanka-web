import { dayCount, groupBudget, type Draft, type Itinerary, type Preferences, type Source } from './model';

type Schema = { type: string | string[]; properties?: Record<string, Schema>; items?: Schema; enum?: unknown[]; required?: string[]; additionalProperties?: boolean };
const str: Schema = { type: 'string' }, num: Schema = { type: 'number' }, nullableNum: Schema = { type: ['number', 'null'] };
const strings: Schema = { type: 'array', items: str };
const object = (properties: Record<string, Schema>): Schema => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const cost = object({ amount: nullableNum, basis: str, sourceIds: strings });
const stay = object({ name: str, description: str, sourceId: { type: ['string', 'null'] }, cost });
export const draftSchema = object({
  title: str, summary: str, assumptions: strings, caveats: strings, conflicts: strings,
  days: { type: 'array', items: object({
    number: num, destination: str, startLocation: str, endLocation: str, overnight: { type: ['string', 'null'] }, highlights: str,
    items: { type: 'array', items: object({
      kind: { type: 'string', enum: ['activity', 'transport'] }, title: str, description: str,
      period: { type: 'string', enum: ['Morning', 'Afternoon', 'Evening'] }, from: str, to: str,
      durationMinutes: nullableNum, bufferMinutes: num, sourceIds: strings, cost,
    }) }, stay: { ...stay, type: ['object', 'null'] },
  }) },
});
function checkShape(value: unknown, s: Schema, path = 'itinerary'): void {
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (!(Array.isArray(s.type) ? s.type : [s.type]).includes(type)) throw new Error(`Incomplete response: ${path} has an invalid format.`);
  if (s.enum && !s.enum.includes(value)) throw new Error(`Invalid choice at ${path}.`);
  if (type === 'string' && (value as string).length > 1800) throw new Error(`Text is too long at ${path}.`);
  if (type === 'number' && !Number.isFinite(value)) throw new Error(`Invalid number at ${path}.`);
  if (type === 'array') {
    if ((value as unknown[]).length > 60) throw new Error(`Too many entries at ${path}.`);
    (value as unknown[]).forEach((v, i) => checkShape(v, s.items!, `${path}.${i}`));
  }
  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    for (const [k, child] of Object.entries(s.properties!)) checkShape(obj[k], child, `${path}.${k}`);
    if (Object.keys(obj).some(k => !s.properties![k])) throw new Error(`Unexpected field at ${path}.`);
  }
}
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
export function safeUrl(url: string) {
  try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.') && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname); } catch { return false; }
}
export function finalize(raw: unknown, p: Preferences, sources: Source[], id: string, mode: 'sample' | 'live'): Itinerary {
  checkShape(raw, draftSchema);
  const draft = raw as Draft;
  if (draft.conflicts.length) throw new Error(`These preferences need another look: ${draft.conflicts.join(' ')}`);
  if (!draft.title.trim() || !draft.summary.trim()) throw new Error('The response is missing its trip summary. Please retry.');
  if (draft.days.length !== dayCount(p)) throw new Error('The itinerary did not match your trip length. Please retry.');
  if (sources.some(s => !safeUrl(s.url)) || new Set(sources.map(s => s.id)).size !== sources.length) throw new Error('Research returned invalid sources. Please retry.');
  const sourceIds = new Set(sources.map(s => s.id));
  const checkRefs = (ids: string[]) => { if (ids.some(id => !sourceIds.has(id))) throw new Error('The itinerary cited an unverified source. Please retry.'); };
  let total = 0, priced = 0;
  const unknown = new Set<string>(['Meals and incidentals', 'Travel insurance and entry requirements', ...(p.flightsIncluded ? ['International flights'] : [])]);
  const addCost = (c: { amount: number | null; basis: string; sourceIds: string[] }, label: string) => {
    checkRefs(c.sourceIds);
    if (c.amount === null) { unknown.add(label); return; }
    if (c.amount < 0 || c.amount > 100000000 || !c.sourceIds.length || !c.basis.trim() || mode === 'sample') throw new Error('A cost estimate has no valid pricing basis or source. Please retry.');
    total += Math.round(c.amount * 100); priced++;
  };
  const seenActivities = new Set<string>();
  draft.days.forEach((d, index) => {
    if (d.number !== index + 1 || !d.destination.trim() || !d.highlights.trim() || !d.items.length || d.items.length > 9) throw new Error('A day has missing or invalid details. Please retry.');
    const expectedStart = index === 0 ? p.arrival : draft.days[index - 1].overnight;
    if (!expectedStart || !same(d.startLocation, expectedStart)) throw new Error(`Day ${d.number} does not connect to the previous night or arrival location. Please retry.`);
    if (index === draft.days.length - 1) {
      if (d.overnight !== null || d.stay !== null || !same(d.endLocation, p.departure)) throw new Error('The final day does not match your departure. Please retry.');
    } else if (!d.overnight || !same(d.endLocation, d.overnight) || !d.stay) throw new Error(`Day ${d.number} is missing a connected overnight stay. Please retry.`);
    let at = d.startLocation, period = -1, minutes = 0;
    const periodMinutes = [0, 0, 0];
    d.items.forEach(item => {
      checkRefs(item.sourceIds);
      const slot = ['Morning', 'Afternoon', 'Evening'].indexOf(item.period);
      if (slot < period) throw new Error(`Day ${d.number} has a timing conflict. Please retry.`);
      period = slot;
      if (!item.title.trim() || !item.description.trim() || !same(item.from, at)) throw new Error(`Day ${d.number} has a disconnected activity or transfer. Please retry.`);
      if (item.durationMinutes !== null && (item.durationMinutes <= 0 || item.durationMinutes > 720)) throw new Error('An activity or journey duration is invalid.');
      if (item.bufferMinutes < 0 || item.bufferMinutes > 180) throw new Error('A journey buffer is invalid.');
      if (item.kind === 'transport') {
        if (item.durationMinutes !== null && (!item.sourceIds.length || item.bufferMinutes < 30)) throw new Error('A journey estimate needs a source and at least a 30-minute buffer.');
        if (item.durationMinutes === null) unknown.add('Journey durations — confirm before travel');
        at = item.to;
      } else {
        if (mode === 'live' && !item.sourceIds.length) throw new Error('An activity has no researched source. Please retry.');
        if (!same(item.from, item.to)) throw new Error('An activity changes location without a transport leg.');
        const key = `${item.title.toLowerCase()}|${item.from.toLowerCase()}`;
        if (seenActivities.has(key)) throw new Error('The itinerary repeats an activity. Please retry.');
        seenActivities.add(key);
      }
      const duration = (item.durationMinutes ?? (item.kind === 'transport' ? 180 : 60)) + item.bufferMinutes;
      minutes += duration; periodMinutes[slot] += duration;
      addCost(item.cost, item.kind === 'transport' ? 'Transport' : 'Activities');
    });
    if (!same(at, d.endLocation)) throw new Error(`Day ${d.number} is missing its final transfer. Please retry.`);
    // Flexible windows, with flight-day time reserved for airport formalities.
    const earlyDeparture = index === draft.days.length - 1 && p.departureTime && p.departureTime < '11:00';
    const arrivalMinutes = index === 0 && p.arrivalTime ? Number(p.arrivalTime.slice(0, 2)) * 60 + Number(p.arrivalTime.slice(3)) + 90 : earlyDeparture ? 0 : 8 * 60;
    const departureMinutes = index === draft.days.length - 1 && p.departureTime ? Number(p.departureTime.slice(0, 2)) * 60 + Number(p.departureTime.slice(3)) - 180 : 22 * 60;
    const available = Math.max(0, departureMinutes - arrivalMinutes);
    const cap = p.pace === 'Relaxed' ? 480 : p.pace === 'Balanced' ? 600 : 720;
    if (minutes > Math.min(cap, available) || periodMinutes.some(m => m > 360)) throw new Error(`Day ${d.number} is too full for your pace or flight times. Adjust your timing or retry.`);
    if (mode === 'live') {
      const windows = [[0, 12 * 60], [12 * 60, 18 * 60], [18 * 60, 24 * 60]];
      if (periodMinutes.some((minutes, slot) => minutes > Math.max(0, Math.min(windows[slot][1], departureMinutes) - Math.max(windows[slot][0], arrivalMinutes)))) {
        throw new Error(`Day ${d.number} has activities outside your available morning, afternoon or evening. Please review flight times or retry.`);
      }
    }
    if (d.stay) {
      if (d.stay.sourceId !== null) checkRefs([d.stay.sourceId]);
      if (mode === 'live' && !d.stay.sourceId) throw new Error('An accommodation suggestion has no researched provider link. Please retry.');
      addCost(d.stay.cost, 'Accommodation');
    }
  });
  const budget = groupBudget(p);
  if (budget !== null && total / 100 > budget) throw new Error('The supported costs alone exceed your budget. Increase the budget or simplify the trip before generating again.');
  return { ...draft, version: 1, id, mode, generatedAt: new Date().toISOString(), preferences: p, sources, knownCost: priced ? total / 100 : null, unknownCosts: [...unknown] };
}
