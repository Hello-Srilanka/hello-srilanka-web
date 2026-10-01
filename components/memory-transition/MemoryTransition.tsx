import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import { MemoryPreviewCard } from '@/components/community/MemoryPreviewCard';
import { communityMemories, itineraryMemories, memoryAuthor, selectedMemory } from './memories';
import styles from './memory-transition.module.css';

export function MemoryTransition({ children }: { children: ReactNode }) {
  return <div className={styles.root} data-memory-transition="">
    <a className={styles.skip} href="#memories-invitation" data-skip-memories="">Skip to the memories</a>
    <div data-memory-itinerary="">{children}</div>
    <p className={styles.srOnly}>The sample itinerary becomes four photographs: a sunset in Negombo, Sigiriya, a train journey towards Ella and a walk in Galle. The photographs collect in a phone. One is chosen with a short thought and shared into an illustrative wall of memories. Nothing is posted by this demonstration.</p>
    <div className={styles.fallbackMoments} aria-hidden="true">
      <p className="eyebrow">DAY BY DAY. MOMENT BY MOMENT.</p>
      <div>{itineraryMemories.map(({ post }) => <figure key={post.id}><Image src={post.photos[0].src} alt="" width={600} height={440} sizes="(max-width:767px) 44vw, 24vw" /><figcaption>{post.visited} / {post.destination}</figcaption></figure>)}</div>
    </div>
    <p className={styles.chapterNote} data-memory-note="" aria-hidden="true">A journey becomes a collection.</p>
    <div className={styles.phoneScene} data-memory-phone-scene="" aria-hidden="true">
      <div className={styles.phone} data-memory-phone="">
        <div className={styles.speaker} />
        <div className={styles.phoneBrand}>hellosrilanka<span>.</span></div>
        <div className={styles.galleryTitle} data-gallery-title="">Your moments <span>04</span></div>
        <div className={styles.gallery} data-phone-gallery="">{itineraryMemories.map(({ post }, i) => <div key={post.id} data-gallery-slot={i} />)}</div>
        <div className={styles.composer} data-memory-composer="">
          <p>Share a memory <Plus size={15} /></p>
          <div className={styles.composerPhoto} data-composer-photo=""><Image src={selectedMemory.post.photos[0].src} alt="" fill sizes="240px" /></div>
          <p className={styles.thought}>{selectedMemory.post.title}</p>
          <span className={styles.tag}>#{selectedMemory.post.topic.toLowerCase()}</span>
          <span className={styles.share} data-memory-share=""><span data-share-label="">Share memory</span><Check size={16} data-share-check="" /></span>
        </div>
        <div className={styles.homeBar} />
      </div>
      <p className={styles.phoneCaption}>A moment worth sharing.</p>
    </div>
    <div className={styles.wall} data-memory-wall="" aria-label="A preview of island memories">
      {itineraryMemories.map(({ post, href, row }, i) => <div className={styles.slot} data-memory-slot={i} key={post.id}>
        <div className={styles.traveller} data-travel-memory={i} data-row-top={row[0]} data-row-height={row[1]}>
          <MemoryPreviewCard post={post} author={memoryAuthor(post)} href={href} personal />
        </div>
      </div>)}
      {communityMemories.map(post => <div className={`${styles.slot} ${styles.community}`} data-community-memory="" key={post.id}>
        <MemoryPreviewCard post={post} author={memoryAuthor(post)} href={`/memories#post=${post.id}`} />
      </div>)}
    </div>
    <div className={styles.invitation} data-memory-invitation="" id="memories-invitation">
      <p className="eyebrow">A LITTLE ISLAND. SO MANY STORIES.</p>
      <h2 className="display" tabIndex={-1}>MEMORIES ARE<br />WHAT WE<br /><span>BRING HOME.</span></h2>
      <div className={styles.links}>
        <Link href="/memories" prefetch={false}>Explore the memories <ArrowUpRight size={19} /></Link>
        <Link href="/memories" prefetch={false}>Share yours <Plus size={18} /></Link>
      </div>
      <p className={styles.sampleNote}>Illustrative memories from the island.</p>
    </div>
  </div>;
}
