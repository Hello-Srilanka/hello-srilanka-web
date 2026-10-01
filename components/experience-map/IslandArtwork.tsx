import { useEffect, useRef, type ReactNode } from 'react';
import { geoToScreen, islandPaths } from '@/lib/experience-map/geography';
import { flightPath, flightPosition, landingPoint } from '@/lib/experience-map/flight';
import styles from './experience-map.module.css';
import { OceanWater } from './OceanWater';
import type { createIslandScene } from './createIslandScene';

const parked = flightPosition(1);
const highlands = geoToScreen(7.05, 80.77);

export function IslandArtwork({ children }: { children?: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createIslandScene>>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false, loaded = false;
    const fail = () => { element.removeAttribute('data-ready'); scene.current?.dispose(); scene.current = null; };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loaded) return;
      loaded = true;
      void import('./createIslandScene').then(({ createIslandScene }) => {
        if (cancelled) return;
        scene.current = createIslandScene(element, fail);
        if (scene.current) element.dataset.ready = 'true';
      }).catch(fail);
    }, { rootMargin: '500px' });
    observer.observe(element);
    return () => { cancelled = true; observer.disconnect(); scene.current?.dispose(); scene.current = null; };
  }, []);

  return <>
    <svg className={styles.ocean} viewBox="0 0 800 800" aria-hidden="true">
      <defs>
        <radialGradient id="island-ocean"><stop stopColor="#d6e0d3" stopOpacity=".65" /><stop offset="1" stopColor="#f5f0e6" stopOpacity="0" /></radialGradient>
        <filter id="island-shadow" x="-50%" y="-30%" width="200%" height="180%"><feGaussianBlur stdDeviation="13" /></filter>
      </defs>
      <ellipse cx="442" cy="430" rx="320" ry="345" fill="url(#island-ocean)" />
      <g fill="none" stroke="#b7c5b6" strokeWidth=".7" opacity=".36">
        <ellipse cx="430" cy="409" rx="255" ry="325" transform="rotate(-8 430 409)" />
        <ellipse cx="430" cy="409" rx="290" ry="360" transform="rotate(-8 430 409)" />
      </g>
      <g className={styles.landShadow} fill="#203f2c" opacity=".2" filter="url(#island-shadow)" transform="translate(13 18)">{islandPaths.map((d, i) => <path key={i} d={d} />)}</g>
    </svg>
    <OceanWater />
    <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    <svg className={styles.fallback} viewBox="0 0 800 800" aria-hidden="true">
      <defs>
        <linearGradient id="island-sand" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dedcc1" /><stop offset=".6" stopColor="#c3c7a1" /><stop offset="1" stopColor="#d9d9b8" /></linearGradient>
        <clipPath id="island-coast-clip">{islandPaths.map((d, i) => <path key={i} d={d} />)}</clipPath>
      </defs>
      <g fill="#9ba783" transform="translate(0 9)">{islandPaths.map((d, i) => <path key={i} d={d} />)}</g>
      <g fill="url(#island-sand)" stroke="#ece5c9" strokeWidth="2">{islandPaths.map((d, i) => <path key={i} d={d} />)}</g>
      <g clipPath="url(#island-coast-clip)" transform={`rotate(7 ${highlands.x} ${highlands.y})`}>
        {[1, .8, .6, .4].map((scale, i) => <ellipse key={scale} cx={highlands.x} cy={highlands.y - i * 3} rx={62 * scale} ry={110 * scale} fill={['#a5b391', '#90a680', '#7f9873', '#708d69'][i]} stroke="#ced2b1" strokeWidth="1" />)}
      </g>
    </svg>
    {children}
    <svg className={styles.flight} viewBox="0 0 800 800" aria-hidden="true">
      <defs><mask id="flight-reveal"><path data-route-reveal d={flightPath} fill="none" stroke="white" strokeWidth="5" pathLength="1" strokeDasharray="1" strokeDashoffset="0" /></mask></defs>
      <path data-route d={flightPath} mask="url(#flight-reveal)" fill="none" stroke="#a84d35" strokeWidth="1.3" strokeDasharray="4 8" opacity=".55" />
      <g className={styles.airport} transform={`translate(${landingPoint.x} ${landingPoint.y})`}>
        <circle data-arrival-ring r="17" fill="none" stroke="#a84d35" opacity=".4" />
        <g transform={`rotate(${parked.angle})`}><rect x="-18" y="-4" width="36" height="8" rx="1" fill="#f5f0e6" stroke="#a84d35" strokeWidth="1" /><path d="M-15 0H15" stroke="#a84d35" strokeWidth="1" strokeDasharray="3 3" /></g>
      </g>
      <g data-plane-shadow opacity=".16" transform={`translate(${parked.x + 2} ${parked.y + 5}) rotate(${parked.angle}) scale(.65)`}>
        <path d="M21 0C20-3 15-3 8-3L-3-18H-8L-4-3H-15L-20-9H-23L-20 0L-23 9H-20L-15 3H-4L-8 18H-3L8 3C15 3 20 3 21 0Z" fill="#203c2c" />
      </g>
      <g data-plane transform={`translate(${parked.x} ${parked.y}) rotate(${parked.angle}) scale(.65)`}>
        <path d="M21 0C20-3 15-3 8-3L-3-18H-8L-4-3H-15L-20-9H-23L-20 0L-23 9H-20L-15 3H-4L-8 18H-3L8 3C15 3 20 3 21 0Z" fill="#fbf6e9" stroke="#355545" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M-17 0H12M-4-3L2-3M-4 3L2 3" stroke="#a84d35" strokeWidth="1.4" />
      </g>
    </svg>
    <span className={styles.oceanLabel}>INDIAN OCEAN</span>
    <span className={styles.north} aria-hidden="true">N<span>↑</span></span>
  </>;
}
