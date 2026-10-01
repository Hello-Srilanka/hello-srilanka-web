import { destinations } from './destinations';
import { clamp, landingPoint, phase, smooth } from './flight';
import { geoToScreen, type Point } from './geography';

type RouteCurve = { start: Point; control: Point; end: Point };
const round = (n: number) => Number(n.toFixed(5));

function pointOnCurve(route: RouteCurve, t: number) {
  const u = 1 - t;
  return {
    x: u * u * route.start.x + 2 * u * t * route.control.x + t * t * route.end.x,
    y: u * u * route.start.y + 2 * u * t * route.control.y + t * t * route.end.y,
  };
}

export const destinationRoutes = destinations.map(destination => {
  const end = geoToScreen(destination.lat, destination.lng);
  const dx = end.x - landingPoint.x, dy = end.y - landingPoint.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.min(65, distance * .2) * (dy < 0 ? 1 : -1);
  const control = {
    x: round((landingPoint.x + end.x) / 2 - dy / distance * bend),
    y: round((landingPoint.y + end.y) / 2 + dx / distance * bend),
  };
  const curve = { start: landingPoint, control, end };
  const lengths = [0];
  let previous = curve.start;
  for (let i = 1; i <= 100; i++) {
    const point = pointOnCurve(curve, i / 100);
    lengths.push(lengths[i - 1] + Math.hypot(point.x - previous.x, point.y - previous.y));
    previous = point;
  }
  return {
    ...curve, destination, distance, lengths,
    path: `M${landingPoint.x},${landingPoint.y} Q${control.x},${control.y} ${end.x},${end.y}`,
  };
}).sort((a, b) => a.distance - b.distance);

export type DestinationRoute = typeof destinationRoutes[number];

export function destinationRouteProgress(scrollProgress: number, index: number) {
  const stagger = index / Math.max(1, destinationRoutes.length - 1);
  return smooth(phase(scrollProgress, .705 + stagger * .015, .85 + stagger * .09));
}

export function destinationRoutePosition(route: DestinationRoute, progress: number) {
  const distance = clamp(progress) * route.lengths[route.lengths.length - 1];
  const index = Math.max(1, route.lengths.findIndex(length => length >= distance));
  const fraction = (distance - route.lengths[index - 1]) / (route.lengths[index] - route.lengths[index - 1]);
  const t = (index - 1 + fraction) / (route.lengths.length - 1);
  const point = pointOnCurve(route, t);
  const dx = 2 * (1 - t) * (route.control.x - route.start.x) + 2 * t * (route.end.x - route.control.x);
  const dy = 2 * (1 - t) * (route.control.y - route.start.y) + 2 * t * (route.end.y - route.control.y);
  return { x: round(point.x), y: round(point.y), angle: round(Math.atan2(dy, dx) * 180 / Math.PI) };
}
