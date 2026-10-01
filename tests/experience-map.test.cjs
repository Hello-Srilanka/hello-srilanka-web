/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { destinations, airport } = require('../lib/experience-map/destinations.ts');
const { geoToMapPosition, geoToScreen, terrainHeight, isOnIsland, spreadMarkers, MAP_ROTATION, MAP_TILT, MAP_CENTER } = require('../lib/experience-map/geography.ts');
const { flightPosition, landingPoint } = require('../lib/experience-map/flight.ts');
const { destinationRoutes, destinationRoutePosition, destinationRouteProgress } = require('../lib/experience-map/destinationRoutes.ts');

test('all 33 requested destinations are unique and inside or immediately beside the island coastline', () => {
  const required = ['pinnawala', 'colombo', 'kandy', 'anuradhapura', 'polonnaruwa', 'jaffna', 'galle', 'dambulla', 'sigiriya', 'temple-of-the-tooth', 'galle-fort', 'nuwara-eliya', 'ella', 'haputale', 'adams-peak', 'yala', 'udawalawe', 'wilpattu', 'minneriya', 'negombo', 'bentota', 'hikkaduwa', 'unawatuna', 'mirissa', 'weligama', 'hiriketiya', 'arugam-bay', 'pasikuda', 'trincomalee', 'horton-plains', 'knuckles', 'sinharaja', 'kitulgala'];
  assert.deepEqual(destinations.map(d => d.id).sort(), required.sort());
  for (const place of [...destinations, airport]) {
    assert.ok(place.lat > 5.9 && place.lat < 9.9 && place.lng > 79.5 && place.lng < 81.9, place.name);
    const nearLand = [-.035, 0, .035].some(a => [-.035, 0, .035].some(b => isOnIsland(place.lng + a, place.lat + b)));
    assert.ok(nearLand, `${place.name} must align with the coastline (including small coastal generalisation)`);
  }
});

test('geographic orientation and Katunayake placement remain correct', () => {
  const find = id => destinations.find(d => d.id === id);
  assert.ok(airport.lat > find('colombo').lat && airport.lat < find('negombo').lat);
  assert.ok(Math.abs(airport.lng - find('negombo').lng) < .06);
  assert.ok(find('jaffna').lat > find('anuradhapura').lat);
  assert.ok(find('trincomalee').lng > find('sigiriya').lng);
  assert.ok(find('yala').lng > find('udawalawe').lng);
  assert.ok(find('galle').lng < find('mirissa').lng);
});

test('HTML and SVG points align with the actual Three.js orthographic transform', async () => {
  const THREE = await import('three');
  for (const place of [...destinations, airport]) {
    const local = geoToMapPosition(place.lat, place.lng, terrainHeight(place.lat, place.lng));
    const world = new THREE.Vector3(local.x, local.y, local.z)
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), MAP_ROTATION)
      .applyAxisAngle(new THREE.Vector3(1, 0, 0), MAP_TILT);
    const screen = geoToScreen(place.lat, place.lng);
    assert.ok(Math.abs(screen.x - (MAP_CENTER.x + world.x)) < .00001);
    assert.ok(Math.abs(screen.y - (MAP_CENTER.y - world.y)) < .00001);
  }
});

test('flight arrives exactly at BIA, with a curved approach and tangent-based heading', () => {
  const start = flightPosition(0), end = flightPosition(1), middle = flightPosition(.5);
  assert.equal(end.x, landingPoint.x);
  assert.equal(end.y, landingPoint.y);
  assert.ok(start.x < 0 && end.x > start.x + 600);
  assert.ok(Math.abs(start.angle - end.angle) > 30);
  assert.ok(Math.abs(middle.y - (start.y + (end.y - start.y) * (middle.x - start.x) / (end.x - start.x))) > 30);
  for (const progress of [.2, .5, .8, .99]) {
    const before = flightPosition(progress - .0001), current = flightPosition(progress), after = flightPosition(progress + .0001);
    const tangent = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
    assert.ok(Math.abs(tangent - current.angle) < .05);
  }
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  assert.ok(distance(flightPosition(.99), end) < distance(flightPosition(.4), flightPosition(.41)), 'Aircraft slows before landing');
  assert.deepEqual(flightPosition(-1), start);
  assert.deepEqual(flightPosition(2), end);
  const compact = flightPosition(.25, true);
  assert.ok(compact.x > 0, 'Phone approach enters the visible map early');
  assert.equal(flightPosition(1, true).x, landingPoint.x);
  assert.equal(flightPosition(1, true).y, landingPoint.y);
});

test('dense coast and heritage markers retain separate touch targets and geographic anchors', () => {
  for (const width of [370, 480, 680, 900]) {
    const layout = spreadMarkers(destinations, width);
    for (let i = 0; i < layout.length; i++) {
      assert.deepEqual(layout[i].anchor, geoToScreen(destinations[i].lat, destinations[i].lng));
      assert.ok(layout[i].point.x > 0 && layout[i].point.x < 800 && layout[i].point.y > 0 && layout[i].point.y < 800);
      for (let j = 0; j < i; j++) assert.ok(Math.hypot(layout[i].point.x - layout[j].point.x, layout[i].point.y - layout[j].point.y) * width / 800 >= 26.99);
    }
  }
});

test('every onward route starts at BIA and reaches its geographic destination with a tangent-aligned arrow', () => {
  assert.deepEqual(destinationRoutes.map(route => route.destination.id).sort(), destinations.map(place => place.id).sort());
  for (const route of destinationRoutes) {
    const start = destinationRoutePosition(route, 0), end = destinationRoutePosition(route, 1);
    assert.deepEqual({ x: start.x, y: start.y }, landingPoint);
    assert.deepEqual({ x: end.x, y: end.y }, geoToScreen(route.destination.lat, route.destination.lng));
    for (const progress of [.2, .5, .8]) {
      const before = destinationRoutePosition(route, progress - .001), after = destinationRoutePosition(route, progress + .001);
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      assert.ok(Math.abs(angle - destinationRoutePosition(route, progress).angle) < .02, route.destination.name);
    }
  }
});

test('onward routes wait for touchdown, stagger outwards, complete before interaction and reverse with scroll', () => {
  for (const [index] of destinationRoutes.entries()) {
    assert.equal(destinationRouteProgress(.7, index), 0);
    assert.equal(destinationRouteProgress(.94, index), 1);
    assert.ok(destinationRouteProgress(.8, index) > destinationRouteProgress(.76, index));
    assert.ok(destinationRouteProgress(.9, index) > destinationRouteProgress(.8, index));
  }
  assert.ok(destinationRouteProgress(.76, 0) > destinationRouteProgress(.76, destinationRoutes.length - 1));
});

const { layoutLandmarks, landmarkReveal, landmarkVisible } = require('../lib/experience-map/landmarks.ts');
test('supplied destination images exist, cover all 31 originals and retain responsive detail levels', () => {
  const path = require('node:path');
  const used = new Set();
  for (const place of destinations) {
    if (place.artwork.image) {
      used.add(place.artwork.image);
      assert.ok(fs.existsSync(path.join(__dirname, '../public/images/map', place.artwork.image)), place.id);
      assert.ok(fs.existsSync(path.join(__dirname, '../public/images/map/thumbnails', place.artwork.image.replace(/\.png$/i, '.webp'))), place.id);
    }
    assert.equal(landmarkVisible(place.artwork, 1440), Boolean(place.artwork.image));
    assert.equal(landmarkVisible(place.artwork, 390), place.artwork.importance === 'primary');
  }
  assert.equal(used.size,31);
  assert.equal(destinations.filter(p=>landmarkVisible(p.artwork,1440)).length,32);
  assert.equal(destinations.filter(p=>landmarkVisible(p.artwork,390)).length,15);
  assert.equal(destinations.filter(p=>landmarkVisible(p.artwork,768)).length,20);
});
test('landmark layout retains geographic anchors and matches Three.js projection at every detail level', () => {
  const { projectPosition } = require('../lib/experience-map/geography.ts');
  for (const [frameWidth, viewport] of [[465,375],[483,390],[700,768],[800,1440]]) {
    const layout = layoutLandmarks(destinations,frameWidth,viewport);
    for (const [i,item] of layout.entries()) {
      assert.deepEqual(item.anchor,geoToScreen(item.place.lat,item.place.lng));
      const projected=projectPosition(item.world);
      assert.ok(Math.hypot(projected.x-item.point.x,projected.y-item.point.y)<.0001);
      for (const other of layout.slice(0,i)) assert.ok(Math.hypot(item.point.x-other.point.x,item.point.y-other.point.y)*frameWidth/800>=26.99);
    }
  }
});
test('miniatures emerge after touchdown, primary first, and finish before controls unlock', () => {
  for (const [index,place] of destinations.entries()) {
    assert.equal(landmarkReveal(.7,place.artwork.importance,index),0);
    assert.equal(landmarkReveal(.94,place.artwork.importance,index),1);
  }
  assert.ok(landmarkReveal(.79,'primary',0)>0);
  assert.equal(landmarkReveal(.79,'secondary',0),0);
});
