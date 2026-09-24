'use client';
import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Camera, BookOpen, MessageCircle, Plus, X, ArrowUpRight, LoaderCircle, Check } from 'lucide-react';
import { destinations, topics, validatePost, type CommunityPhoto, type CommunityPost, type PostKind, type Topic } from '@/lib/community/model';
import { preparePhoto } from '@/lib/community/storage';
import CommunityDialog from './CommunityDialog';

export default function PostComposer({ close, publish, name, initialKind = 'moment', initialTitle = '' }: { close: () => void; publish: (post: CommunityPost) => Promise<void>; name: string; initialKind?: PostKind; initialTitle?: string }) {
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState('');
  const [destination, setDestination] = useState('');
  const [topic, setTopic] = useState<Topic>('Slow');
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [discard, setDiscard] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const submitting = useRef(false);
  const dirty = Boolean(title || body || photos.length);
  function requestClose() { if (publishing || busy) return; if (dirty && !success) setDiscard(true); else close(); }
  async function upload(files: FileList | null) {
    if (!files?.length || uploading.current) return;
    if (photos.length + files.length > 4) { setError('A little edit goes a long way. Choose up to four photographs.'); return; }
    uploading.current = true; setBusy(true); setError('');
    try {
      const additions = await Promise.all(Array.from(files).map(async file => ({ ...await preparePhoto(file), alt: '' })));
      setPhotos(previous => [...previous, ...additions]);
    } catch (err) { setError(err instanceof Error ? err.message : 'That photograph could not be opened. Try another JPG, PNG, or WebP.'); }
    finally { uploading.current = false; setBusy(false); if (uploadRef.current) uploadRef.current.value = ''; }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (submitting.current || busy) return;
    const draft = { kind, title: title.trim(), body: body.trim(), destination, photos };
    const issue = validatePost(draft);
    if (issue) { setError(issue); return; }
    if (photos.some(photo => !photo.alt.trim())) { setError('Add a short description for each photograph so everyone can enjoy it.'); return; }
    submitting.current = true; setPublishing(true); setError('');
    try {
      await publish({ ...draft, id: crypto.randomUUID(), authorId: 'you', topic, likes: 0, createdAt: new Date().toISOString(), visited: 'Your journal', readMinutes: kind === 'story' ? Math.max(1, Math.ceil(body.split(/\s+/).length / 180)) : undefined });
      setSuccess(true);
    } catch { setError('Your post could not be saved. Your draft is still here. Free some browser storage and try again.'); }
    finally { submitting.current = false; setPublishing(false); }
  }
  return <CommunityDialog title="Share your Sri Lanka" close={requestClose}>
    {success ? <div className="co-published"><span className="co-success-stamp"><Check size={37} strokeWidth={1.5} /></span><p className="co-eyebrow">ONE MORE STORY WORTH KEEPING</p><h2>A little piece<br />of <em>your Sri Lanka.</em></h2><p>Your memory is in your collection, saved on this device. Thanks for giving the island another perspective.</p><button className="co-primary" onClick={close}>See your memory <ArrowUpRight size={18} /></button></div> : <form className="co-composer-form" onSubmit={submit}>
      <p className="co-eyebrow">ISLAND MEMORIES</p><h2>What will you remember?</h2><p className="co-form-intro">A beautiful view. A small discovery. Something worth sharing.</p>
      <div className="co-kind-picker" role="group" aria-label="Post type">{([{ id: 'moment', label: 'A moment', Icon: Camera }, { id: 'story', label: 'A story', Icon: BookOpen }, { id: 'question', label: 'A question', Icon: MessageCircle }] as const).map(({ id, label, Icon }) => <button type="button" key={id} aria-pressed={kind === id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}><Icon size={18} />{label}</button>)}</div>
      <label className="co-label">{kind === 'question' ? 'What would you like to ask?' : 'Give it a title'}<input required minLength={5} maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder={kind === 'question' ? 'Where did you find your favourite…?' : 'The moment I’ll remember…'} /></label>
      <label className="co-label">{kind === 'question' ? 'A little context' : 'Tell us a little more'}<textarea required minLength={10} maxLength={5000} rows={kind === 'story' ? 6 : 4} value={body} onChange={event => setBody(event.target.value)} placeholder={kind === 'story' ? 'Start anywhere. The unexpected detour, the person you met, the feeling you brought home…' : 'What made it special?'} /><span className="co-field-note">{body.length.toLocaleString('en-US')} / 5,000</span></label>
      <div className="co-form-row"><label className="co-label">Where in Sri Lanka?<select required value={destination} onChange={event => setDestination(event.target.value)}><option value="">Choose a place</option>{destinations.map(place => <option key={place}>{place}</option>)}</select></label><label className="co-label">The feeling<select value={topic} onChange={event => setTopic(event.target.value as Topic)}>{topics.map(feeling => <option key={feeling}>{feeling}</option>)}</select></label></div>
      <div className="co-upload-heading"><span className="co-label">Your photographs {kind !== 'moment' && <small>(optional)</small>}</span><span>{photos.length} / 4</span></div>
      <input ref={uploadRef} className="co-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple tabIndex={-1} aria-label="Upload photographs" onChange={event => void upload(event.target.files)} />
      {photos.length > 0 && <div className="co-upload-previews">{photos.map((photo, index) => <div key={index}><div className="co-upload-thumb"><Image src={photo.src} alt={photo.alt || `Selected photograph ${index + 1}`} fill unoptimized /><button type="button" onClick={() => setPhotos(previous => previous.filter((_, i) => index !== i))} aria-label={`Remove photograph ${index + 1}`}><X size={14} /></button></div><label className="co-label co-alt-label">Photo {index + 1} description<input required maxLength={180} value={photo.alt} onChange={event => setPhotos(previous => previous.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} placeholder="What’s in the photograph?" /></label></div>)}</div>}
      {photos.length < 4 && <button type="button" className="co-upload-zone" disabled={busy} onClick={() => uploadRef.current?.click()}>{busy ? <LoaderCircle size={25} className="co-spin" /> : <Plus size={25} strokeWidth={1.3} />}<span>{busy ? 'Getting your photographs ready…' : 'Add a little of what you saw'}</span><small>JPG, PNG or WebP · Up to 12 MB each</small></button>}
      {error && <p role="alert" className="co-form-error">{error}</p>}
      <div className="co-composer-submit"><p>Posting as <strong>{name}</strong><br /><span>Preview · Saved on this device only.</span></p><button className="co-primary" disabled={busy || publishing}>{publishing ? 'Saving…' : 'Save my memory'}<ArrowUpRight size={18} /></button></div>
      {discard && <div className="co-discard" role="alert"><p>Leave this story behind? Your unfinished draft will be discarded.</p><div><button type="button" className="co-secondary" onClick={() => setDiscard(false)}>Keep writing</button><button type="button" className="co-danger-button" onClick={close}>Discard draft</button></div></div>}
    </form>}
  </CommunityDialog>;
}
