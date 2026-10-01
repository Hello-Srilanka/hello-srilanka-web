import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Bookmark } from 'lucide-react';
import type { Author, CommunityPost } from '@/lib/community/model';
import { Avatar } from './PostCard';
import styles from './memory-preview.module.css';

/** Read-only companion to PostCard: same content, author and visual language.
 * Interactions belong to the real /memories feed, never the scroll illustration. */
export function MemoryPreviewCard({ post, author, href, personal = false }: {
  post: CommunityPost; author: Author; href: string; personal?: boolean;
}) {
  const photo = post.photos[0];
  return <article className={styles.card} data-memory-card="">
    <div className={styles.photo} data-memory-photo="">
      <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 44vw, (max-width: 1100px) 25vw, 360px" />
      {personal && <span className={styles.place} data-moment-label="">{post.visited} / {post.destination}</span>}
    </div>
    <div className={styles.details} data-memory-details="">
      <div className={styles.byline}><Avatar author={author} small /><span>{personal ? 'A travel memory' : author.name}</span><span className={styles.yours} data-yours="">{personal ? 'Yours' : ''}</span></div>
      <h3><Link href={href} prefetch={false}>{post.title}<span className={styles.linkArea} aria-hidden="true" /></Link></h3>
      <div className={styles.meta}><span>#{post.topic.toLowerCase()}</span><span aria-hidden="true"><Bookmark size={13} data-memory-save="" /><ArrowUpRight size={14} /></span></div>
    </div>
  </article>;
}
