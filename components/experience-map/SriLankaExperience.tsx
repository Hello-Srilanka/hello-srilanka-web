'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { airport, destinations } from '@/lib/experience-map/destinations';
import { landingPoint } from '@/lib/experience-map/flight';
import { layoutLandmarks } from '@/lib/experience-map/landmarks';
import { LandmarkArtwork } from './landmarks/LandmarkArtwork';
import { IslandArtwork } from './IslandArtwork';
import { DestinationCard } from './DestinationCard';
import { DestinationRoutes } from './DestinationRoutes';
import { useExperienceScroll } from './useExperienceScroll';
import styles from './experience-map.module.css';

export function SriLankaExperience() {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(680);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [engaged, setEngaged] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const lastMarker = useRef<HTMLButtonElement | null>(null);
  const returningFocus = useRef(false);
  useExperienceScroll(root);
  useEffect(() => {
    if (!frame.current) return;
    const viewport = () => setViewportWidth(window.innerWidth);
    viewport();
    window.addEventListener('resize', viewport, { passive: true });
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(frame.current);
    return () => { observer.disconnect(); window.removeEventListener('resize', viewport); };
  }, []);
  const markers = useMemo(() => layoutLandmarks(destinations, frameWidth, viewportWidth), [frameWidth, viewportWidth]);
  const destination = destinations.find(place => place.id === selected);
  const close = () => {
    setSelected(null);
    setEngaged(null);
    returningFocus.current = true;
    lastMarker.current?.focus({ preventScroll: true });
    returningFocus.current = false;
  };

  return <div id="destinations" ref={root} data-experience-map className={styles.journey} data-selected={Boolean(destination)} onKeyDown={event => { if (event.key === 'Escape' && selected) { event.preventDefault(); close(); } }}>
    <div className={styles.stage} data-journey-stage>
      <div className={`chapter-label ${styles.chapter}`}><p className="eyebrow">02 — EXPERIENCE</p></div>
      <div className={`intro section-space ${styles.opening}`}>
        <div className="intro-heading"><h2 id="experience-title" className="display">ONE ISLAND.<br />A THOUSAND WAYS<br /><span>TO EXPERIENCE IT.</span></h2><ArrowDownRight size={76} strokeWidth={.8} /></div>
      </div>
      <div className={styles.exploration}>
        <div className={styles.approachNote} aria-hidden="true"><span>NEXT STOP · SRI LANKA</span><p>The journey<br />{' '}begins here.</p></div>
        <div className={styles.guide}>
        </div>
        <div className={styles.mapFrame} ref={frame} style={{ '--artwork-size': `${frameWidth / 800 * 48}px` } as CSSProperties} role="group" aria-label="Explore Sri Lanka destinations" aria-describedby="map-keyboard-help">
          <p id="map-keyboard-help" className={styles.srOnly}>Focus a point to read about a place. Press Enter to reach its card. Press Escape to close the card.</p>
          <IslandArtwork><DestinationRoutes selected={selected} /></IslandArtwork>
          <div className={styles.arrival} style={{ left: `${landingPoint.x / 8}%`, top: `${landingPoint.y / 8}%` }}>
            <span className={styles.arrivalLine} /><p><span className={styles.arrivalBefore}>YOUR ARRIVAL</span><span className={styles.arrivalAfter}>ARRIVED · BIA</span><strong>Katunayake</strong><small>{airport.name}</small></p>
          </div>
          <svg className={styles.leaders} viewBox="0 0 800 800" aria-hidden="true">{markers.map(({ place, anchor, point }, i) => <g key={place.id} style={{ '--reveal-order': i / markers.length } as CSSProperties}>
            <line x1={anchor.x} y1={anchor.y} x2={point.x} y2={point.y} /><circle cx={anchor.x} cy={anchor.y} r="1.5" />
          </g>)}</svg>
          <div className={styles.markers} data-map-controls>{markers.map(({ place, point, visible, scale, order }, i) => <button
            type="button" key={place.id} data-destination={place.id}
            data-artwork-visible={visible} data-landmark-importance={place.artwork.importance} data-landmark-order={order} data-landmark-tablet={Boolean(place.artwork.tablet)} data-engaged={engaged === place.id}
            className={`${styles.marker} ${selected === place.id ? styles.markerSelected : ''}`}
            style={{ left: `${point.x / 8}%`, top: `${point.y / 8}%`, '--reveal-order': i / markers.length } as CSSProperties}
            aria-label={`Explore ${place.name}`} aria-pressed={selected === place.id} aria-controls="map-place-details"
            onPointerEnter={event => { if (event.pointerType === 'mouse') { lastMarker.current = event.currentTarget; setSelected(place.id); setEngaged(place.id); } }}
            onPointerLeave={event => { if (event.pointerType === 'mouse') setEngaged(null); }}
            onBlur={() => setEngaged(null)}
            onFocus={event => { lastMarker.current = event.currentTarget; if (!returningFocus.current) { setSelected(place.id); setEngaged(place.id); } }}
            onClick={event => {
              lastMarker.current = event.currentTarget; setSelected(place.id); setEngaged(place.id);
              if (event.detail === 0) requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>('#map-place-details a')?.focus({ preventScroll: true }));
            }}
          ><span className={styles.landmarkEmergence}>{visible && <LandmarkArtwork artwork={place.artwork} scale={scale} />}</span><span className={styles.pin} /><span className={styles.markerLabel}>{place.name.replace(' National Park', '').replace('Mountain Range', '')}</span></button>)}</div>
        </div>

        <div className={styles.details} id="map-place-details" data-map-controls>
          {destination ? <DestinationCard destination={destination} close={close} /> : null}
          <span className={styles.srOnly} role="status">{destination ? `${destination.name}. ${destination.description}` : ''}</span>
        </div>
        <div className={styles.mapFootnote}><span>07°10′N &nbsp; 79°53′E &nbsp; · &nbsp;</span><a href="#island-stories">Keep following the feeling <ArrowDownRight size={15} /></a></div>
      </div>
      <span className={styles.scrollNote} aria-hidden="true">SCROLL TO ARRIVE <span /></span>
    </div>
    <noscript><div className={styles.noScript}><h3>Find your corner of Sri Lanka</h3><p>From the highlands to the coast, discover a place that feels like you.</p><ul>{destinations.map(place => <li key={place.id}><strong>{place.name}</strong><p>{place.description}</p></li>)}</ul><a href="#experiences">Explore all experiences →</a></div></noscript>
  </div>;
}
