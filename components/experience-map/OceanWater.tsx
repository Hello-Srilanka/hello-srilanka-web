import { useEffect, useRef, type CSSProperties } from 'react';
import { islandPaths } from '@/lib/experience-map/geography';
import styles from './experience-map.module.css';

// Currents live in the same 800-unit map space as the coastline and flight.
const currents = [
  'M175 232q18-9 36 0t36 0',
  'M141 320q16-8 32 0t32 0',
  'M151 423q18-9 36 0t36 0',
  'M161 538q15-7 30 0t30 0',
  'M214 627q14-7 28 0t28 0',
  'M343 738q18-8 36 0t36 0',
  'M507 716q16-8 32 0t32 0',
  'M611 626q18-9 36 0t36 0',
  'M655 507q16-8 32 0t32 0',
  'M640 365q20-9 40 0t40 0',
  'M574 233q16-8 32 0t32 0',
  'M455 83q16-8 32 0t32 0',
];

export function OceanWater() {
  const water = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = water.current;
    if (!element) return;
    let inView = false;
    const update = () => { element.dataset.playing = String(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  return <svg ref={water} className={styles.oceanWater} viewBox="0 0 800 800" aria-hidden="true" focusable="false">
    <defs>
      <mask id="map-open-water" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1200" height="1200">
        <rect x="-200" y="-200" width="1200" height="1200" fill="white" />
        <g fill="black" stroke="black" strokeWidth="20">{islandPaths.map((d,i)=><path key={i} d={d} />)}</g>
      </mask>
      <radialGradient id="map-water-wash"><stop offset=".3" stopColor="#87b3ad" stopOpacity=".18" /><stop offset=".72" stopColor="#a4c5bf" stopOpacity=".1" /><stop offset="1" stopColor="#f5f0e6" stopOpacity="0" /></radialGradient>
    </defs>
    <g mask="url(#map-open-water)">
      <ellipse cx="440" cy="425" rx="345" ry="380" fill="url(#map-water-wash)" />
      <g transform="rotate(-8 430 409)" fill="none">
        {[0,1,2].map(index=><ellipse key={index} className={styles.waterRipple} cx="430" cy="409" rx="225" ry="302" style={{ '--water-delay': `${index * -4}s` } as CSSProperties} />)}
      </g>
      <g className={styles.waterCurrents} fill="none" strokeLinecap="round">
        {currents.map((d,index)=><path key={d} d={d} className={styles.waterCurrent} style={{ '--water-delay': `${index * -.73}s`, '--water-duration': `${7 + index % 4}s` } as CSSProperties} />)}
      </g>
    </g>
  </svg>;
}
