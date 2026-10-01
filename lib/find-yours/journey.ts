import { airport, destinations } from '@/lib/experience-map/destinations';
import { geoToScreen, ISLAND_DEPTH } from '@/lib/experience-map/geography';
import { interests } from '@/lib/planner/interests';

// A visual example, not a route recommendation, price or weather forecast.
const place = (id: string) => {
  const destination = destinations.find(item => item.id === id);
  if (!destination) throw new Error(`Unknown journey destination: ${id}`);
  return { ...destination, point: geoToScreen(destination.lat, destination.lng, ISLAND_DEPTH) };
};
export const arrival = geoToScreen(airport.lat, airport.lng, ISLAND_DEPTH);
export const messyStops = ['colombo', 'ella', 'galle', 'kandy', 'yala', 'mirissa'].map(place);
export const plannedStops = ['kandy', 'ella', 'udawalawe', 'mirissa', 'galle'].map(place);
export const selectedInterests = ['Nature', 'Culture', 'Wildlife'].map(name => interests.find(item => item.name === name)!);
export const dayLabels = ['01', '02–03', '04', '05–06', '07'];
export const messyPath = [arrival, ...messyStops.map(stop => stop.point)].map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
export const plannedPath = [arrival, ...plannedStops.map(stop => stop.point)].map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
