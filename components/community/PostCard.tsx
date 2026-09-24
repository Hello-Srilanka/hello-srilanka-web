'use client';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Bookmark, Heart, MessageCircle, Images, ArrowRight, Share2 } from 'lucide-react';
import type { Author, CommunityPost } from '@/lib/community/model';

export function Avatar({ author, small = false }: { author: Author; small?: boolean }) { return <span className={`co-avatar co-avatar-${author.color} ${small ? 'co-avatar-small' : ''}`} aria-hidden="true">{author.initials}</span>; }
export default function PostCard({ post, author, liked, saved, commentCount, open, like, save, profile, share }: {
  post: CommunityPost; author: Author; liked: boolean; saved: boolean; commentCount: number;
  open: (comments?: boolean) => void; like: () => void; save: () => void; profile: () => void; share: () => void;
}) {
  const reduced = useReducedMotion();
  const isQuestion = post.kind === 'question';
  return <article className={`co-post co-post-${post.kind}`}>
    <div className="co-post-byline"><button className="co-author" onClick={profile}><Avatar author={author} /><span><strong>{author.name}</strong><small>{post.destination} <span>·</span> {post.visited || 'On the road'}</small></span></button><span className="co-post-type">{post.kind === 'story' ? 'FIELD NOTES' : post.kind === 'question' ? 'ASK THE ISLAND' : 'A LITTLE MOMENT'}</span></div>
    {post.photos.length > 0 && <button className="co-post-image" onClick={() => open()} aria-label={`Open ${post.title}`}><Image src={post.photos[0].src} alt={post.photos[0].alt} width={post.photos[0].width ?? 1400} height={post.photos[0].height ?? 1400} sizes="(max-width: 680px) 92vw, (max-width: 1150px) 44vw, 508px" unoptimized={post.photos[0].src.startsWith('data:')} />{post.photos.length > 1 && <span className="co-photo-count"><Images size={13} />{post.photos.length}</span>}<span className="co-photo-open"><ArrowUpRight size={20} /></span></button>}
    <div className="co-post-copy">{isQuestion && <MessageCircle className="co-question-symbol" size={28} strokeWidth={1.3} />}<button className="co-title-button" onClick={() => open()}><h3>{post.title}</h3></button><p>{post.body.split('\n')[0]}</p><div className="co-post-meta"><span>#{post.topic.toLowerCase()}</span>{post.kind === 'story' && <button onClick={() => open()}>Read the story <ArrowUpRight size={13} /></button>}{isQuestion && <button onClick={() => open(true)}>Join the conversation <ArrowRight size={14} /></button>}</div></div>
    <div className="co-post-actions"><motion.button whileTap={reduced ? undefined : { scale: .86 }} className={liked ? 'is-liked' : ''} onClick={like} aria-pressed={liked} aria-label={`${liked ? 'Unlike' : 'Like'} ${post.title}`}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /><span>{post.likes + Number(liked)}</span></motion.button><button onClick={() => open(true)} aria-label={`Comments on ${post.title}`}><MessageCircle size={18} /><span>{commentCount}</span></button><button onClick={share} aria-label={`Share ${post.title}`}><Share2 size={17} /></button><motion.button whileTap={reduced ? undefined : { scale: .86 }} className={`co-save ${saved ? 'is-saved' : ''}`} onClick={save} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} ${post.title}`}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /><span>{saved ? 'Saved' : 'Save'}</span></motion.button></div>
  </article>;
}
