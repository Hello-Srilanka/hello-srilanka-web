import * as THREE from 'three';
import { coastlineRings, geoToMapPosition, isOnIsland, ISLAND_DEPTH, MAP_CENTER, MAP_ROTATION, MAP_SIZE, MAP_TILT, terrainHeight } from '@/lib/experience-map/geography';

export function createIslandScene(canvas: HTMLCanvasElement, onFailure: () => void) {
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-MAP_CENTER.x, MAP_SIZE - MAP_CENTER.x, MAP_CENTER.y, MAP_CENTER.y - MAP_SIZE, .1, 2000);
  camera.position.z = 1000;
  scene.add(new THREE.AmbientLight(0xfff9e9, 2.2));
  const sunlight = new THREE.DirectionalLight(0xfff7df, 2.6);
  sunlight.position.set(-400, 500, 800);
  scene.add(sunlight);
  const tilt = new THREE.Group();
  tilt.rotation.x = MAP_TILT;
  const island = new THREE.Group();
  island.rotation.z = MAP_ROTATION;
  tilt.add(island);
  scene.add(tilt);

  const sand = new THREE.MeshStandardMaterial({ color: '#d8d6b7', roughness: 1, metalness: 0 });
  const edge = new THREE.MeshStandardMaterial({ color: '#abaf89', roughness: 1, metalness: 0 });
  for (const ring of coastlineRings) {
    const shape = new THREE.Shape(ring.map(([lng, lat]) => {
      const p = geoToMapPosition(lat, lng);
      return new THREE.Vector2(p.x, p.y);
    }));
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: ISLAND_DEPTH, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 1.3, bevelThickness: 1.4, curveSegments: 1 }), [sand, edge]);
    island.add(mesh);
    const points = ring.map(([lng, lat]) => {
      const p = geoToMapPosition(lat, lng, ISLAND_DEPTH + 1.6);
      return new THREE.Vector3(p.x, p.y, p.z);
    });
    island.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#ede8cf', transparent: true, opacity: .85 })));
  }

  // A small geographic grid gives the highlands real relief without textures or a DEM.
  const vertices: number[] = [], colors: number[] = [];
  const lowland = new THREE.Color('#c8cba5'), highland = new THREE.Color('#52745a');
  const step = .045;
  const addTriangle = (coordinates: [number, number][]) => {
    if (!coordinates.every(([lng, lat]) => isOnIsland(lng, lat))) return;
    const averageHeight = coordinates.reduce((sum, [lng, lat]) => sum + terrainHeight(lat, lng), 0) / 3;
    const color = lowland.clone().lerp(highland, Math.min(1, (averageHeight - ISLAND_DEPTH) / 27));
    for (const [lng, lat] of coordinates) {
      const p = geoToMapPosition(lat, lng, terrainHeight(lat, lng) + 1.5);
      vertices.push(p.x, p.y, p.z);
      colors.push(color.r, color.g, color.b);
    }
  };
  for (let lat = 5.9; lat < 9.86; lat += step) {
    for (let lng = 79.5; lng < 81.9; lng += step) {
      addTriangle([[lng, lat], [lng + step, lat], [lng, lat + step]]);
      addTriangle([[lng + step, lat], [lng + step, lat + step], [lng, lat + step]]);
    }
  }
  const terrain = new THREE.BufferGeometry();
  terrain.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  island.add(new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));

  let visible = false, disposed = false, frame = 0, renderCount = 0;
  const render = () => {
    frame = 0;
    if (!visible || disposed || document.hidden) return;
    renderer.render(scene, camera);
    canvas.dataset.renderCount = String(++renderCount);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
  };
  const requestRender = () => { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(render); };
  const resize = new ResizeObserver(() => { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); requestRender(); });
  resize.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; requestRender(); }, { rootMargin: '150px' });
  visibility.observe(canvas);
  const lost = (event: Event) => { event.preventDefault(); onFailure(); };
  canvas.addEventListener('webglcontextlost', lost);
  document.addEventListener('visibilitychange', requestRender);
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      document.removeEventListener('visibilitychange', requestRender);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
    },
  };
}
