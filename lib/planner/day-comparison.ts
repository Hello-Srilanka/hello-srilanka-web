import { readCitations } from './citations';
import type { Day } from './model';

export function comparableDay(day: Day) {
  const { startLocation, endLocation, overnight, destination, items, stay } = day;
  return {
    startLocation, endLocation, overnight, destination: readCitations(destination).text,
    items: items.map(({ kind, title, period, description, from, to, durationMinutes, bufferMinutes, cost }) => ({
      kind, period, title: readCitations(title).text, description: readCitations(description).text,
      from, to, durationMinutes, bufferMinutes, amount: cost.amount,
    })),
    stay: stay && { name: readCitations(stay.name).text, description: readCitations(stay.description).text, amount: stay.cost.amount },
  };
}
