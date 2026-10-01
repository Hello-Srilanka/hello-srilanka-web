import coastline from './coastline.json';

export const MAP_SIZE = 800;
export const MAP_CENTER = { x: 430, y: 370 };
export const MAP_SCALE = 150;
export const MAP_TILT = 0.48;
export const MAP_ROTATION = -0.12;
export const ISLAND_DEPTH = 10;
export type Point = { x: number; y: number };
const stable = (value: number) => Number(value.toFixed(5));

export function geoToMapPosition(lat: number, lng: number, elevation = 0) {
  return { x: (lng - 80.7) * MAP_SCALE * Math.cos(8 * Math.PI / 180), y: (lat - 7.85) * MAP_SCALE, z: elevation };
}

export function terrainHeight(lat: number, lng: number) {
  const hill = (a: number, b: number, width: number, length: number, height: number) =>
    height * Math.exp(-(((lng - b) / width) ** 2 + ((lat - a) / length) ** 2));
  const ridges = 0.83 + 0.17 * Math.sin(lat * 32 + lng * 16) * Math.cos(lng * 29);
  return ISLAND_DEPTH + ridges * (hill(6.98, 80.77, .37, .48, 33) + hill(7.46, 80.74, .19, .27, 18) + hill(6.82, 81, .22, .22, 13));
}

// The same orthographic transform drives WebGL, SVG, HTML markers and the flight.
export function projectPosition({ x, y, z = 0 }: Point & { z?: number }): Point {
  const rx = x * Math.cos(MAP_ROTATION) - y * Math.sin(MAP_ROTATION);
  const ry = x * Math.sin(MAP_ROTATION) + y * Math.cos(MAP_ROTATION);
  return { x: stable(MAP_CENTER.x + rx), y: stable(MAP_CENTER.y - ry * Math.cos(MAP_TILT) + z * Math.sin(MAP_TILT)) };
}

export function geoToScreen(lat: number, lng: number, elevation = terrainHeight(lat, lng)) {
  return projectPosition(geoToMapPosition(lat, lng, elevation));
}

export const coastlineRings = coastline;
export const islandPaths = coastlineRings.map(ring => ring.map(([lng, lat], i) => {
  const p = geoToScreen(lat, lng, ISLAND_DEPTH);
  return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
}).join(' ') + 'Z');

export function isOnIsland(lng: number, lat: number) {
  return coastlineRings.some(ring => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

export function spreadMarkers<T extends { lat: number; lng: number }>(places: T[], frameWidth: number) {
  const gap = 27 * MAP_SIZE / Math.max(frameWidth, 320);
  const placed: Point[] = [];
  return places.map(place => {
    const anchor = geoToScreen(place.lat, place.lng);
    let point = anchor;
    for (let attempt = 0; attempt < 320; attempt++) {
      const radius = Math.sqrt(attempt) * gap * .44;
      const angle = attempt * 2.399963;
      const candidate = { x: stable(anchor.x + Math.cos(angle) * radius), y: stable(anchor.y + Math.sin(angle) * radius) };
      if (placed.every(other => Math.hypot(other.x - candidate.x, other.y - candidate.y) >= gap)) { point = candidate; break; }
    }
    placed.push(point);
    return { place, anchor, point };
  });
}
