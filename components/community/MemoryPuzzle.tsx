'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Heart, MapPin } from 'lucide-react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, UIEvent } from 'react';
import type { CommunityPost } from '@/lib/community/model';

const cardHeights = ['medium', 'short', 'tall', 'hero', 'short', 'medium', 'tall'] as const;
const tilts = [-2.2, 1.4, -1, 1.7, -1.6, 1.1, -1.2];
const FOLLOW = 0.14;
const MAX_STEP = 22;

export default function MemoryPuzzle({ posts, open }: { posts: CommunityPost[]; open: (post: CommunityPost) => void }) {
  const [active, setActive] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const desiredRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const pointerInsideRef = useRef(false);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      alignToCard(0, false);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (scrollFrameRef.current != null) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [posts.length]);

  function alignToCard(index: number, smooth = true) {
    const viewport = viewportRef.current;
    const card = cardRefs.current[index];
    if (!viewport || !card) return;
    const maxLeft = viewport.scrollWidth - viewport.clientWidth;
    const left = Math.min(maxLeft, Math.max(0, card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2));
    setActive(index);
    desiredRef.current = left;
    viewport.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }

  function runScrollFrame(time: number) {
    const viewport = viewportRef.current;
    if (!viewport) {
      scrollFrameRef.current = null;
      lastFrameRef.current = 0;
      return;
    }
    const elapsed = lastFrameRef.current ? Math.min(34, time - lastFrameRef.current) : 16.7;
    lastFrameRef.current = time;
    const frame = elapsed / 16.7;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const delta = desiredRef.current - viewport.scrollLeft;
    const cap = MAX_STEP * frame;
    const step = Math.max(-cap, Math.min(cap, delta * (1 - Math.pow(1 - FOLLOW, frame))));
    const nextLeft = Math.min(maxScroll, Math.max(0, viewport.scrollLeft + step));
    viewport.scrollLeft = nextLeft;
    if (!pointerInsideRef.current && Math.abs(desiredRef.current - nextLeft) < 0.5) {
      viewport.scrollLeft = desiredRef.current;
      scrollFrameRef.current = null;
      lastFrameRef.current = 0;
      return;
    }
    scrollFrameRef.current = requestAnimationFrame(runScrollFrame);
  }

  function queueScrollFrame() {
    if (scrollFrameRef.current == null) scrollFrameRef.current = requestAnimationFrame(runScrollFrame);
  }

  function followScroll(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget;
    const centre = viewport.scrollLeft + viewport.clientWidth / 2;
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const nextDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
      if (nextDistance < distance) { closest = index; distance = nextDistance; }
    });
    setActive(current => current === closest ? current : closest);
  }

  function followPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const viewport = event.currentTarget;
    const bounds = viewport.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    desiredRef.current = maxScroll * progress;
    queueScrollFrame();
  }

  function onPointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    pointerInsideRef.current = true;
    queueScrollFrame();
  }

  function onPointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    pointerInsideRef.current = false;
    desiredRef.current = event.currentTarget.scrollLeft;
  }

  return <div className="memory-deck" aria-label="Interactive memory wall">
    <header className="memory-deck-heading">
      <p>TRAVEL DIARY · SRI LANKA</p>
      <h3>Stories you may like.</h3>
      <span>Move through the island one memory at a time.</span>
    </header>

    <div
      className="memory-deck-viewport"
      ref={viewportRef}
      onScroll={followScroll}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerMove={followPointer}
    >
      <div className="memory-deck-track">
        {posts.map((post, index) => {
          const photo = post.photos[0];
          const height = post.kind === 'story' ? 'hero' : cardHeights[index % cardHeights.length];
          const style = { '--card-tilt': `${tilts[index % tilts.length]}deg` } as CSSProperties;
          return <button
            type="button"
            key={post.id}
            ref={node => { cardRefs.current[index] = node; }}
            className={`memory-deck-card memory-deck-${height} memory-deck-${post.kind}${active === index ? ' is-active' : ''}${photo ? '' : ' memory-deck-no-photo'}`}
            style={style}
            aria-label={`Open ${post.title}`}
            aria-current={active === index ? 'true' : undefined}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => open(post)}
          >
            {photo && <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 680px) 68vw, 250px" unoptimized={photo.src.startsWith('data:')} />}
            <span className="memory-deck-shade" aria-hidden="true" />
            <span className="memory-deck-place"><MapPin size={10} />{post.destination}</span>
            <span className="memory-deck-copy">
              <small>{post.kind === 'question' ? 'ASK THE ISLAND' : post.kind === 'story' ? 'FIELD NOTE' : 'A LITTLE MOMENT'}</small>
              <strong>{post.title}</strong>
              <span className="memory-deck-meta"><i>{post.authorId.slice(0, 2).toUpperCase()}</i><span><Heart size={11} />{post.likes}</span></span>
            </span>
          </button>;
        })}
      </div>
    </div>

    <footer className="memory-deck-footer">
      <div className="memory-deck-controls">
        <span><b>{String(active + 1).padStart(2, '0')}</b><i />{String(posts.length).padStart(2, '0')}</span>
      </div>
      <p>Move your cursor to explore · Select a card to open</p>
    </footer>
  </div>;
}
