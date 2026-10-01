import { airport, type Destination } from './destinations';
import { MAP_CENTER, MAP_ROTATION, MAP_SCALE, MAP_SIZE, MAP_TILT, geoToScreen, terrainHeight, type Point } from './geography';
import { phase } from './flight';

export type LandmarkSpec = { image?: string; importance: 'primary' | 'secondary'; tablet?: boolean; scale?: number; rotation?: number };
export type LandmarkPlacement = { place: Destination; anchor: Point; point: Point; world: { x: number; y: number; z: number }; visible: boolean; scale: number; order: number };
const stable = (n: number) => Number(n.toFixed(5));

export function landmarkVisible(spec: LandmarkSpec, viewportWidth: number) {
  return Boolean(spec.image) && (viewportWidth >= 1024 || spec.importance === 'primary' || (viewportWidth >= 768 && Boolean(spec.tablet)));
}

// Inverse of the existing projection: offsets remain local to geographic anchors,
// including displaced touch targets. WebGL and SVG use exactly this same position.
export function screenToLandmarkPosition(point: Point, elevation: number) {
  const x = point.x - MAP_CENTER.x;
  const y = (MAP_CENTER.y - point.y + elevation * Math.sin(MAP_TILT)) / Math.cos(MAP_TILT);
  return { x: stable(x * Math.cos(MAP_ROTATION) + y * Math.sin(MAP_ROTATION)), y: stable(-x * Math.sin(MAP_ROTATION) + y * Math.cos(MAP_ROTATION)), z: elevation };
}

export function landmarkReveal(progress: number, importance: LandmarkSpec['importance'], order: number) {
  const start = (importance === 'primary' ? .715 : .815) + Math.min(order, 20) * .002;
  const t = phase(progress, start, start + .075);
  return 1 - (1 - t) ** 3;
}

export function layoutLandmarks(places: Destination[], frameWidth: number, viewportWidth: number): LandmarkPlacement[] {
  const unit = MAP_SIZE / Math.max(frameWidth, 320);
  const gap = (viewportWidth < 1024 ? 40 : 35) * unit;
  const placed: (Point & { radius: number })[] = [{ ...geoToScreen(airport.lat, airport.lng), radius: 18 * unit }];
  const minX = viewportWidth <= 600 ? Math.max(45, (800 - viewportWidth * unit) / 2 + 24 * unit) : 45;
  const maxX = 800 - minX;
  // Major miniatures get the closest available positions; all markers stay accessible.
  const ordered = [...places].sort((a, b) => Number(b.artwork.importance === 'primary') - Number(a.artwork.importance === 'primary'));
  const layout = new Map<string, LandmarkPlacement>();
  let primaryOrder = 0, secondaryOrder = 0;
  for (const place of ordered) {
    const anchor = geoToScreen(place.lat, place.lng);
    // Keep Negombo's image north of the airport's arrival caption.
    const localOffsetY = place.id === 'negombo' ? -40 * unit : 0;
    const visible = landmarkVisible(place.artwork, viewportWidth);
    const radius = (visible ? gap : 27 * unit) / 2;
    let point = anchor;
    for (let attempt = 0; attempt < 700; attempt++) {
      const displacement = Math.sqrt(attempt) * gap * .43;
      const angle = attempt * 2.399963;
      const candidate = { x: stable(anchor.x + Math.cos(angle) * displacement), y: stable(anchor.y + localOffsetY + Math.sin(angle) * displacement) };
      if (candidate.x < minX || candidate.x > maxX || candidate.y < 45 || candidate.y > 745) continue;
      if (placed.every(other => Math.hypot(other.x - candidate.x, other.y - candidate.y) >= radius + other.radius)) { point = candidate; break; }
    }
    placed.push({ ...point, radius });
    let world = screenToLandmarkPosition(point, terrainHeight(place.lat, place.lng) + 2);
    // Re-sample relief after collision separation, so models do not sink into a nearby ridge.
    for (let i = 0; i < 5; i++) {
      const lat = world.y / MAP_SCALE + 7.85;
      const lng = world.x / (MAP_SCALE * Math.cos(8 * Math.PI / 180)) + 80.7;
      world = screenToLandmarkPosition(point, terrainHeight(lat, lng) + 2);
    }
    const primary = place.artwork.importance === 'primary';
    layout.set(place.id, { place, anchor, point, world, visible, scale: (primary ? 1 : .68) * (place.artwork.scale ?? 1), order: primary ? primaryOrder++ : secondaryOrder++ });
  }
  return places.map(place => layout.get(place.id)!);
}
