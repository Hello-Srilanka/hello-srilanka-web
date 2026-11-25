import { dayCount, type Preferences, type Draft, type Item, unknownCost } from './model';

export function sampleDraft(p: Preferences): Draft {
  const n = dayCount(p);
  const places = n < 4 ? ['Negombo'] : n < 7 ? ['Negombo', 'Sigiriya', 'Kandy'] : ['Negombo', 'Sigiriya', 'Kandy', 'Ella', 'Galle'];
  const themes: Record<string, [string, string]> = {
    Nature: ['Time among the greenery', 'A gentle walk and room to enjoy the landscape. Choose a suitable local trail after checking conditions.'],
    Beaches: ['A little time by the sea', 'Unhurried coast time. Confirm local sea conditions before entering the water.'],
    Wildlife: ['Discover the island’s wildlife', 'Explore a locally appropriate wildlife experience after confirming access, travel time and ethical operators.'],
    Adventure: ['Find a little adventure', 'Leave space for a guided outdoor experience suitable for your group. Activity and access still need checking.'],
    Food: ['A taste of Sri Lanka', 'Make time for a local meal and ask your host about regional specialities.'],
    Culture: ['Stories of the island', 'Explore the local heritage at your own pace. Confirm opening times and entry requirements first.'],
    'Local life': ['Meet the everyday island', 'A neighbourhood wander, a market stop and a chance to slow down.'],
    Nightlife: ['An evening out', 'Ask your host about suitable evening venues and arrange a safe return.'],
    Wellness: ['Room to reset', 'A quiet morning, a slower breakfast and time to recharge.'],
    'Scenic journeys': ['Take the scenic way', 'Leave space to enjoy the changing scenery; any rail service or reservation needs confirmation.'],
  };
  let previous = p.arrival;
  return {
    title: 'A little island. Your own story.',
    summary: 'An illustrative Sri Lanka journey to try the planner. This sample follows a preset route and is not live research or a confirmed travel plan.',
    assumptions: ['Sample route only; interests influence the suggested themes.', 'All activities are flexible ideas. Transport, accommodation, access and seasonal suitability need research.', `Your preference: ${p.transport.toLowerCase()} and ${p.accommodation.toLowerCase()}. Specific providers are not selected in sample mode.`],
    caveats: ['Sample mode does not verify must-visit places, accessibility needs or child suitability. These preferences are retained for live generation.', 'No prices, availability or journey estimates have been researched. Your budget is a target, not an estimated total.', 'Confirm all transfers and allow adequate time before committing to flights or stays.'],
    conflicts: [],
    days: Array.from({ length: n }, (_, i) => {
      const last = i === n - 1;
      const destination = last ? previous : places[Math.min(places.length - 1, Math.floor(i * places.length / Math.max(1, n - 1)))];
      const start = previous;
      const items: Item[] = [];
      if (start !== destination) items.push({ kind: 'transport', title: `On to ${destination}`, description: `Illustrative transfer using your ${p.transport.toLowerCase()} preference. Route and duration need confirmation.`, period: 'Morning', from: start, to: destination, durationMinutes: null, bufferMinutes: 0, sourceIds: [], cost: unknownCost() });
      const interest = p.interests[i % p.interests.length] || 'Local life';
      const [title, description] = themes[interest] || themes['Local life'];
      items.push({ kind: 'activity', title: `${title} · chapter ${i + 1}`, description: last ? 'Keep this day light for departure. Any outing depends on your confirmed transfer and flight times.' : description, period: items.length ? 'Afternoon' : 'Morning', from: destination, to: destination, durationMinutes: last ? 30 : p.pace === 'Relaxed' ? 60 : 90, bufferMinutes: 0, sourceIds: [], cost: unknownCost() });
      if (last && destination !== p.departure) items.push({ kind: 'transport', title: 'Your onward journey', description: 'Arrange your departure transfer. Confirm the journey time and airport arrival requirements with your provider.', period: 'Afternoon', from: destination, to: p.departure, durationMinutes: null, bufferMinutes: 0, sourceIds: [], cost: unknownCost() });
      previous = last ? p.departure : destination;
      return { number: i + 1, destination, startLocation: start, endLocation: previous, overnight: last ? null : destination, highlights: last ? 'A slow farewell · onward journey' : title, items,
        stay: last ? null : { name: `Your stay in ${destination}`, description: `${p.accommodation === 'Help me decide' ? 'A locally suitable stay' : p.accommodation} to be researched. No property or room availability has been verified.`, sourceId: null, cost: unknownCost() },
      };
    }),
  };
}
