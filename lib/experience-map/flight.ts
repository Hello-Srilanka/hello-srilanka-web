import { airport } from './destinations';
import { geoToScreen, type Point } from './geography';

export const landingPoint = geoToScreen(airport.lat, airport.lng);
// Approach from the southwest; the final tangent is aligned with the runway.
export const flightPoints: [Point, Point, Point, Point] = [
  { x: -360, y: 90 }, { x: -110, y: 160 },
  { x: landingPoint.x - 175, y: landingPoint.y + 150 }, landingPoint,
];
export const compactFlightPoints: typeof flightPoints = [
  { x: -45, y: 135 }, { x: 40, y: 215 },
  { x: landingPoint.x - 150, y: landingPoint.y + 125 }, landingPoint,
];
export const getFlightPath = (compact = false) => {
  const points = compact ? compactFlightPoints : flightPoints;
  return `M${points[0].x},${points[0].y} C${points.slice(1).map(p => `${p.x},${p.y}`).join(' ')}`;
};
export const flightPath = getFlightPath();
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const phase = (n: number, start: number, end: number) => clamp((n - start) / (end - start));
export const smooth = (n: number) => n * n * (3 - 2 * n);

function curvePoint(t: number, compact = false) {
  const u = 1 - t;
  const [a, b, c, d] = compact ? compactFlightPoints : flightPoints;
  const x = u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x;
  const y = u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y;
  return { x, y };
}

function sampleLengths(compact: boolean) {
  const samples = Array.from({ length: 201 }, (_, i) => curvePoint(i / 200, compact));
  const lengths = [0];
  for (let i = 1; i < samples.length; i++) lengths.push(lengths[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  return lengths;
}
const fullLengths = sampleLengths(false), compactLengths = sampleLengths(true);

export function flightPosition(progress: number, compact = false) {
  const lengths = compact ? compactLengths : fullLengths;
  const totalLength = lengths[lengths.length - 1];
  const distance = 1 - (1 - clamp(progress)) ** 1.3;
  const target = distance * totalLength;
  const index = Math.max(1, lengths.findIndex(length => length >= target));
  const fraction = (target - lengths[index - 1]) / (lengths[index] - lengths[index - 1]);
  const t = (index - 1 + fraction) / (lengths.length - 1);
  const { x, y } = curvePoint(t, compact);
  const u = 1 - t;
  const [a, b, c, d] = compact ? compactFlightPoints : flightPoints;
  const dx = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x);
  const dy = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y);
  return { x: Number(x.toFixed(5)), y: Number(y.toFixed(5)), angle: Number((Math.atan2(dy, dx) * 180 / Math.PI).toFixed(5)), t, distance };
}
