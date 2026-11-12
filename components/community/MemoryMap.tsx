'use client';

import Image from 'next/image';
import { ArrowDown, MapPin } from 'lucide-react';
import { geoToScreen, islandPaths, ISLAND_DEPTH } from '@/lib/experience-map/geography';
import type { CommunityPost } from '@/lib/community/model';

type MemoryPlace = { name: string; lat: number; lng: number };

const seedPlaces: Record<string, MemoryPlace> = {
  'long-way-to-ella': { name: 'Ella', lat: 6.87427, lng: 81.05342 },
  'a-view-for-two': { name: 'Sigiriya', lat: 7.957, lng: 80.7603 },
  'one-more-wave': { name: 'Weligama', lat: 5.97501, lng: 80.42968 },
  'window-seat-dreams': { name: 'Nuwara Eliya', lat: 6.97078, lng: 80.78286 },
  'steps-into-stillness': { name: 'Anuradhapura', lat: 8.31223, lng: 80.41306 },
  'tea-country-voices': { name: 'Haputale', lat: 6.76566, lng: 80.95104 },
  'a-little-perspective': { name: 'Knuckles', lat: 7.466, lng: 80.732 },
  'between-the-plans': { name: 'Negombo', lat: 7.2083, lng: 79.8358 },
  'wild-quiet': { name: 'Udawalawe', lat: 6.51591, lng: 80.85388 },
  'a-table-in-the-shade': { name: 'Colombo', lat: 6.93548, lng: 79.84868 },
  'waterfall-afternoon': { name: 'Kitulgala', lat: 6.9966, lng: 80.4068 },
  'one-more-little-street': { name: 'Galle Fort', lat: 6.026, lng: 80.217 },
  'roads-worth-remembering': { name: 'Kandy', lat: 7.2906, lng: 80.6336 },
  'when-the-island-glows': { name: 'Dambulla', lat: 7.86, lng: 80.65167 },
  'above-the-everyday': { name: 'Horton Plains', lat: 6.8031, lng: 80.7979 },
  'gentle-moments': { name: 'Jaffna', lat: 9.66845, lng: 80.00742 },
  'a-trail-of-your-own': { name: 'Sinharaja', lat: 6.3897, lng: 80.5015 },
  'light-and-living-tradition': { name: 'Temple of the Tooth', lat: 7.2936, lng: 80.6413 },
  'the-unhurried-way': { name: 'Mirissa', lat: 5.95245, lng: 80.45667 },
  'the-view-from-here': { name: 'Arugam Bay', lat: 6.8589, lng: 81.8304 },
};

const destinationPlaces: Record<string, MemoryPlace> = {
  Ella: seedPlaces['long-way-to-ella'], Galle: { name: 'Galle', lat: 6.0461, lng: 80.2103 },
  Hiriketiya: { name: 'Hiriketiya', lat: 5.963, lng: 80.706 }, Kandy: seedPlaces['roads-worth-remembering'],
  Colombo: seedPlaces['a-table-in-the-shade'], Sigiriya: seedPlaces['a-view-for-two'],
  Udawalawe: seedPlaces['wild-quiet'], 'Nuwara Eliya': seedPlaces['window-seat-dreams'],
  Mirissa: seedPlaces['the-unhurried-way'], 'Arugam Bay': seedPlaces['the-view-from-here'],
  Negombo: seedPlaces['between-the-plans'],
};

function resolvePlace(post: CommunityPost, index: number): MemoryPlace {
  const known = seedPlaces[post.id] ?? destinationPlaces[post.destination];
  if (known) return known;
  const fallback = Object.values(destinationPlaces)[index % Object.values(destinationPlaces).length];
  return post.destination === 'Sri Lanka' || post.destination === 'Elsewhere in Sri Lanka'
    ? fallback
    : { ...fallback, name: post.destination };
}

export default function MemoryMap({ posts }: { posts: CommunityPost[] }) {
  const occurrences = new Map<string, number>();
  const points = posts.map((post, index) => {
    const place = resolvePlace(post, index);
    const anchor = geoToScreen(place.lat, place.lng, ISLAND_DEPTH);
    const count = occurrences.get(place.name) ?? 0;
    occurrences.set(place.name, count + 1);
    const angle = count * 2.4;
    const radius = count ? 12 + count * 4 : 0;
    return { post, place, x: anchor.x + Math.cos(angle) * radius, y: anchor.y + Math.sin(angle) * radius };
  });

  return <section className="memory-map-hero" aria-labelledby="memory-map-title">
    <div className="memory-map-copy">
      <p className="memory-map-eyebrow">ISLAND MEMORIES · EXPLORE BY PLACE</p>
      <h1 id="memory-map-title">Every memory<br />has a place.</h1>
      <p>Follow the points around Sri Lanka. Each one marks a photograph, story or question collected somewhere on the island.</p>
      <div className="memory-map-key"><span><i />{points.length} memories on the island</span><span><MapPin size={14} />Places where stories happened</span></div>
      <a href="#community-feed">Browse every memory <ArrowDown size={15} /></a>
    </div>

    <div className="memory-map-stage" role="group" aria-label="Map of Sri Lanka memories">
      <svg className="memory-map-island" viewBox="0 0 800 800" aria-hidden="true">
        <defs>
          <linearGradient id="memory-island-fill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9f15a" /><stop offset="1" stopColor="#91b748" /></linearGradient>
          <radialGradient id="memory-sea-wash"><stop stopColor="#315c51" stopOpacity=".55" /><stop offset="1" stopColor="#0b2b24" stopOpacity="0" /></radialGradient>
          <filter id="memory-island-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15" /></filter>
          <clipPath id="memory-island-clip">{islandPaths.map((path, index) => <path key={index} d={path} />)}</clipPath>
        </defs>
        <ellipse cx="430" cy="405" rx="300" ry="350" fill="url(#memory-sea-wash)" />
        <g fill="#041c17" opacity=".45" filter="url(#memory-island-shadow)" transform="translate(14 18)">{islandPaths.map((path, index) => <path key={index} d={path} />)}</g>
        <g fill="url(#memory-island-fill)" stroke="#e7f78e" strokeWidth="2">{islandPaths.map((path, index) => <path key={index} d={path} />)}</g>
        <g clipPath="url(#memory-island-clip)" fill="none" stroke="#315c35" strokeWidth="1" opacity=".34">
          <path d="M320 180C430 260 505 350 520 600" /><path d="M285 360C390 320 500 330 575 420" /><path d="M325 540C400 495 500 500 555 555" />
        </g>
      </svg>
      <span className="memory-map-north" aria-hidden="true">N <b>↑</b></span>
      <span className="memory-map-ocean" aria-hidden="true">INDIAN OCEAN</span>
      <div className="memory-map-points" aria-hidden="true">{points.map(({ post, place, x, y }) => <span
        key={post.id}
        className={`memory-map-point memory-map-point-${post.kind}${y < 170 ? ' memory-map-point-top' : ''}`}
        style={{ left: `${x / 8}%`, top: `${y / 8}%` } as React.CSSProperties}
      >
        <span className="memory-map-dot" />
        <span className="memory-map-preview">
          <span className="memory-map-thumb">
            {post.photos[0] && <Image
              src={post.photos[0].src}
              alt=""
              fill
              sizes="102px"
              unoptimized={post.photos[0].src.startsWith('data:')}
            />}
          </span>
          <span>
            <small>{place.name} · {post.topic}</small>
            <strong>{post.title}</strong>
            <em>Find it in the wall below ↓</em>
          </span>
        </span>
      </span>)}</div>
      <p className="memory-map-instruction">MEMORIES ACROSS THE ISLAND</p>
    </div>
  </section>;
}
