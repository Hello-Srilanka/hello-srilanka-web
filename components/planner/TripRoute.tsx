import { coastlineRings, type Point } from '@/lib/experience-map/geography';
import type { Itinerary } from '@/lib/planner/model';
import { itineraryRoute, tripMapPoint } from '@/lib/planner/trip-route';

const coastline = coastlineRings.map(ring => ring.map(([lng, lat], index) => {
  const { x, y } = tripMapPoint(lat, lng);
  return `${index === 0 ? 'M' : 'L'}${x},${y}`;
}).join('') + 'Z');

const offsets = [{ x: 0, y: 0 }, ...[27, 44, 65, 88].flatMap(distance =>
  Array.from({ length: 8 }, (_, index) => ({
    x: Math.round(distance * Math.cos(index * Math.PI / 4)),
    y: Math.round(distance * Math.sin(index * Math.PI / 4)),
  })),
)];

function positionMarkers(stops: ReturnType<typeof itineraryRoute>) {
  const first = stops[0];
  const last = stops.at(-1);
  const roundTrip = first.point && last?.point?.x === first.point.x && last.point.y === first.point.y;
  const markers: { label: string; anchor: Point; position: Point }[] = [];
  for (const stop of stops) {
    if (!stop.point || (roundTrip && stop === last)) continue;
    const anchor = stop.point;
    const position = offsets.map(offset => ({ x: anchor.x + offset.x, y: anchor.y + offset.y }))
      .find(({ x, y }) => x >= 20 && x <= 300 && y >= 14 && y <= 234 &&
        markers.every(marker => Math.abs(x - marker.position.x) >= 30 || Math.abs(y - marker.position.y) >= 24));
    markers.push({ anchor, position: position ?? anchor, label: roundTrip && stop === first ? 'A/D' : stop.marker });
  }
  return markers;
}

export default function TripRoute({ days }: { days: Itinerary['days'] }) {
  const stops = itineraryRoute({ days });
  if (!stops.length) return null;
  const markers = positionMarkers(stops);
  if (!markers.length) return null;
  const description = stops.map(({ name, detail, mapArea, point }) => {
    const location = mapArea ? `${name} (${mapArea} area)` : name;
    return `${detail} · ${location}${point ? '' : ' (unmapped)'}`;
  }).join('. ');
  const legs = new Set<string>();
  stops.slice(1).forEach((stop, index) => {
    const from = stops[index].point;
    const to = stop.point;
    if (!from || !to || (from.x === to.x && from.y === to.y)) return;
    const [start, end] = [`${from.x},${from.y}`, `${to.x},${to.y}`].sort();
    legs.add(`M${start}L${end}`);
  });

  return <section className="journal-route-preview" aria-labelledby="journal-route-heading">
    <h2 id="journal-route-heading">Trip route</h2>
    <figure className="journal-route-map">
      <svg viewBox="0 0 320 248" role="img" aria-label="Approximate trip route" aria-describedby="journal-route-description" focusable="false">
        <desc id="journal-route-description">{description}</desc>
        {coastline.map((path, index) => <path key={index} className="journal-route-island" d={path} />)}
        {[...legs].map(leg => <path key={leg} className="journal-route-leg" d={leg} />)}
        {markers.filter(({ anchor, position }) => position.x !== anchor.x || position.y !== anchor.y)
          .map(({ label, anchor, position }) => <g key={label}>
            <line className="journal-route-leader" x1={anchor.x} y1={anchor.y} x2={position.x} y2={position.y} />
            <circle className="journal-route-anchor" cx={anchor.x} cy={anchor.y} r="2" />
          </g>)}
        {markers.map(({ label, position: { x, y } }) => <g key={label} className="journal-route-pin" transform={`translate(${x},${y})`}>
          <rect x={label === 'A/D' ? -15 : -11} y="-10" width={label === 'A/D' ? 30 : 22} height="20" rx="10" />
          <text textAnchor="middle" dominantBaseline="central">{label}</text>
        </g>)}
      </svg>
      <figcaption>Approximate route <span aria-hidden="true">·</span> <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a></figcaption>
    </figure>
  </section>;
}
