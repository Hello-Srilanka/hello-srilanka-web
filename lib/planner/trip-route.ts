import { airport, destinations } from '../experience-map/destinations';
import { geoToMapPosition } from '../experience-map/geography';
import { readCitations } from './citations';
import type { Day, Itinerary } from './model';

type Location = { name: string; lat: number; lng: number };
type Visit = { name: string; days: Day[] };

function locationKey(name: string) {
  return name.trim().toLowerCase().replace(/,\s*sri lanka$/, '').replace(/\s+/g, ' ');
}

const locations = new Map<string, Location>();
for (const destination of destinations) {
  locations.set(locationKey(destination.name), destination);
  locations.set(destination.id.replaceAll('-', ' '), destination);
}
for (const name of [airport.name, `${airport.name} (CMB)`, 'Colombo Airport', 'Colombo International Airport', 'CMB', 'BIA']) {
  locations.set(locationKey(name), airport);
}

function hotelArea({ name, days }: Visit) {
  const hotel = locationKey(name);
  const areas = days.map(day => {
    if (!day.stay || locationKey(readCitations(day.stay.name).text) !== hotel) return undefined;
    const place = locations.get(locationKey(readCitations(day.destination).text));
    return place === airport ? undefined : place;
  });
  const words = (value: string) => ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  // A city named in the hotel can disambiguate days spent on an outing elsewhere.
  const namedAreas = new Set(areas.filter(place => place && words(name).includes(words(place.name))));
  if (namedAreas.size === 1) return namedAreas.values().next().value;
  // Without a match in the name, require agreement across the entire multi-night stay.
  const firstArea = areas[0];
  if (days.length > 1 && firstArea && areas.every(place => place === firstArea)) return firstArea;
}

export function tripMapPoint(lat: number, lng: number) {
  const { x, y } = geoToMapPosition(lat, lng);
  return { x: Math.round((160 + x * 0.38) * 10) / 10, y: Math.round((124 - y * 0.38) * 10) / 10 };
}

export function itineraryRoute({ days }: Pick<Itinerary, 'days'>) {
  const first = days[0];
  const last = days.at(-1);
  if (!first || !last) return [];

  const arrival = readCitations(first.startLocation).text.trim();
  const departure = readCitations(last.endLocation).text.trim();
  const visits: Visit[] = [];
  for (const day of days) {
    const place = day.overnight && readCitations(day.overnight).text.trim();
    if (!place) continue;
    const previous = visits.at(-1);
    if (previous && locationKey(previous.name) === locationKey(place)) previous.days.push(day);
    else visits.push({ name: place, days: [day] });
  }
  if (visits.length === 0) {
    const place = readCitations(first.destination).text.trim();
    if (place && ![arrival, departure].some(endpoint => locationKey(endpoint) === locationKey(place))) {
      visits.push({ name: place, days: [] });
    }
  }

  return [
    { name: arrival, marker: 'A', detail: 'Arrival' },
    ...visits.map((visit, index) => {
      const nights = visit.days.length;
      return {
        name: visit.name,
        marker: String(index + 1),
        detail: nights === 0 ? 'Day visit' : `${nights} ${nights === 1 ? 'night' : 'nights'}`,
        area: locations.has(locationKey(visit.name)) ? undefined : hotelArea(visit),
      };
    }),
    { name: departure, marker: 'D', detail: 'Departure' },
  ].map(stop => {
    const area = 'area' in stop ? stop.area : undefined;
    const place = locations.get(locationKey(stop.name)) ?? area;
    return { name: stop.name, marker: stop.marker, detail: stop.detail, mapArea: area?.name, point: place ? tripMapPoint(place.lat, place.lng) : null };
  });
}
