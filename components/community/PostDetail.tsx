'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Bookmark, Heart, ChevronLeft, ChevronRight, Send, Flag, MapPin, Share2, Check } from 'lucide-react';
import type { Author, CommunityComment, CommunityPost } from '@/lib/community/model';
import CommunityDialog from './CommunityDialog';
import { Avatar } from './PostCard';

export default function PostDetail({ post, author, comments, liked, saved, like, save, addComment, close, share, report, focusComments, own, remove }: {
  post: CommunityPost; author: Author; comments: CommunityComment[]; liked: boolean; saved: boolean;
  like: () => void; save: () => void; addComment: (body: string) => void; close: () => void; share: () => void; report: () => void;
  focusComments: boolean; own: boolean; remove: () => void;
}) {
  const [photo, setPhoto] = useState(0);
  const [comment, setComment] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('Spam or advertising');
  const [deleting, setDeleting] = useState(false);
  const commentInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (focusComments) { const frame = requestAnimationFrame(() => commentInput.current?.focus()); return () => cancelAnimationFrame(frame); } }, [focusComments]);
  function submit(event: FormEvent) { event.preventDefault(); if (!comment.trim()) return; addComment(comment.trim()); setComment(''); }
  const current = post.photos[photo];
  return <CommunityDialog title={post.title} close={close} wide>
    <div className={`co-detail ${post.photos.length ? '' : 'co-detail-text'}`}>
      {current && <div className="co-detail-gallery"><div className="co-detail-photo"><Image src={current.src} alt={current.alt} fill sizes="(max-width: 800px) 100vw, 60vw" unoptimized={current.src.startsWith('data:')} /><span className="co-detail-place"><MapPin size={14} />{post.destination}</span>{post.photos.length > 1 && <div className="co-gallery-controls"><button aria-label="Previous photograph" onClick={() => setPhoto(value => (value - 1 + post.photos.length) % post.photos.length)}><ChevronLeft size={20} /></button><span aria-live="polite">{photo + 1} / {post.photos.length}</span><button aria-label="Next photograph" onClick={() => setPhoto(value => (value + 1) % post.photos.length)}><ChevronRight size={20} /></button></div>}</div>{current.credit && <p className="co-photo-credit">Photo: {current.credit}</p>}{current.original && <a className="co-original-link" href={current.original} target="_blank" rel="noopener noreferrer">View full-resolution photograph ↗</a>}{post.photos.length > 1 && <div className="co-gallery-thumbs">{post.photos.map((item, index) => <button key={index} aria-label={`View photograph ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}><Image src={item.src} alt="" fill sizes="80px" unoptimized={item.src.startsWith('data:')} /></button>)}</div>}</div>}
      <div className="co-detail-body"><div className="co-author"><Avatar author={author} /><span><strong>{author.name}</strong><small>{author.country} · {post.sample ? 'Sample contributor' : 'Your journal'}</small></span></div><p className="co-eyebrow co-detail-kicker">{post.kind === 'question' ? 'ASK THE ISLAND' : post.kind === 'story' ? 'FIELD NOTES' : 'A MEMORY WORTH KEEPING'} <span> / </span> {post.topic}</p><h2>{post.title}</h2><div className="co-detail-prose">{post.body.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="co-detail-action-row"><button onClick={like} aria-label={`${liked ? 'Unlike' : 'Like'} ${post.title}`} aria-pressed={liked} className={liked ? 'is-liked' : ''}><Heart size={18} fill={liked ? 'currentColor' : 'none'} />{post.likes + Number(liked)}</button><button onClick={save} aria-pressed={saved}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save'}</button><button onClick={share}><Share2 size={17} />Share</button></div>
      <div className="co-comments"><h3>A little conversation <span>{comments.length}</span></h3>{comments.length ? comments.map(item => <div className="co-comment" key={item.id}><span className="co-comment-dot">{item.name.charAt(0)}</span><div><strong>{item.name}</strong>{item.sample && <small>Sample</small>}<p>{item.body}</p></div></div>) : <p className="co-no-comments">Be the first to leave a little kindness or a useful tip.</p>}<form onSubmit={submit} className="co-comment-form"><label htmlFor="community-comment">Add to the conversation</label><div><textarea ref={commentInput} id="community-comment" value={comment} onChange={event => setComment(event.target.value)} maxLength={1000} rows={2} placeholder="A thought, a tip, a little hello…" required /><button disabled={!comment.trim()} aria-label="Post comment"><Send size={18} /></button></div><small>Your comment stays in this browser preview.</small></form></div>
      <div className="co-detail-bottom">{own ? <button onClick={() => setDeleting(true)}>Delete my post</button> : <button onClick={() => setReporting(true)}><Flag size={13} />Report / hide post</button>}<span>{post.sample ? 'Illustrative community story' : 'Only visible on this device'}</span></div>
      {reporting && <div className="co-inline-panel"><h3>Help keep the island welcoming.</h3><p>In this preview, this hides the post for you. No report is sent to a moderator.</p><label className="co-label">Reason<select value={reason} onChange={event => setReason(event.target.value)}><option>Spam or advertising</option><option>Harmful or inappropriate content</option><option>Misleading travel information</option><option>Something else</option></select></label><div><button className="co-secondary" onClick={() => setReporting(false)}>Cancel</button><button className="co-primary" onClick={report}>Hide this post <Check size={16} /></button></div></div>}
      {deleting && <div className="co-inline-panel"><h3>Delete this post from your journal?</h3><p>This removes the post and its comments from this browser.</p><div><button className="co-secondary" onClick={() => setDeleting(false)}>Keep post</button><button className="co-danger-button" onClick={remove}>Delete post</button></div></div>}
      </div>
    </div>
  </CommunityDialog>;
}
