'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowRight, Plus, Search, Bookmark, MapPin, Compass, X, Check, SlidersHorizontal, Waves, Mountain, Coffee, Sun, Leaf, Copy, Undo2 } from 'lucide-react';
import { authors, seedComments, seedPosts } from '@/lib/community/data';
import { emptyState, filterPosts, initials, topics, type Author, type CommunityPost, type CommunityState, type FeedTab, type PostKind } from '@/lib/community/model';
import { readCommunity, saveCommunity } from '@/lib/community/storage';
import PostCard, { Avatar } from './PostCard';
import CommunityDialog from './CommunityDialog';
import PostComposer from './PostComposer';
import PostDetail from './PostDetail';
import MemoryFilm from './MemoryFilm';
import { Navbar } from '@/components/Navbar';

const topicIcons = [Waves, Mountain, Coffee, Compass, Leaf];
type ComposerState = { kind: PostKind; title?: string };

export default function Community() {
  const [state, setState] = useState<CommunityState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [tab, setTab] = useState<FeedTab>('discover');
  const [topic, setTopic] = useState('');
  const [destination, setDestination] = useState('');
  const [query, setQuery] = useState('');
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [detail, setDetail] = useState<{ id: string; comments: boolean } | null>(null);
  const [profile, setProfile] = useState<string | null>(null);
  const [sharing, setSharing] = useState<CommunityPost | null>(null);
  const [guidelines, setGuidelines] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(24);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    let mounted = true;
    void readCommunity().then(value => { if (mounted) setState(value); }).catch(() => { if (mounted) setStorageError('Device storage is unavailable. You can explore, but changes may be lost when you leave.'); }).finally(() => { if (mounted) setReady(true); });
    const hash = () => { const match = window.location.hash.match(/^#post=([a-zA-Z0-9-]+)$/); if (match) setDetail({ id: match[1], comments: false }); else setDetail(null); };
    hash(); window.addEventListener('hashchange', hash);
    return () => { mounted = false; window.removeEventListener('hashchange', hash); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    void saveCommunity(state).catch(() => setStorageError('Your latest changes could not be saved on this device. Keep this tab open and free browser storage before trying again.'));
  }, [ready, state]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4200); return () => clearTimeout(timer); }, [notice]);
  const posts = [...state.posts, ...seedPosts];
  const comments = [...seedComments, ...state.comments];
  const you: Author = { id: 'you', name: state.profile.name, initials: initials(state.profile.name), color: 'jungle', country: 'Your corner of the island', bio: state.profile.bio };
  const authorFor = (id: string) => id === 'you' ? you : authors.find(author => author.id === id) ?? authors[0];
  const filtered = filterPosts(posts, { tab, topic, destination, query, saved: state.saves, hidden: state.hidden });
  const selected = detail ? posts.find(post => post.id === detail.id && !state.hidden.includes(post.id)) : undefined;
  const profileAuthor = profile ? authorFor(profile) : null;
  const profilePosts = profile ? posts.filter(post => post.authorId === profile && !state.hidden.includes(post.id)) : [];
  const savedCount = posts.filter(post => state.saves.includes(post.id) && !state.hidden.includes(post.id)).length;
  function mutate(updater: (previous: CommunityState) => CommunityState) { if (!ready) return; setState(updater); }
  function toggle(id: string, key: 'likes' | 'saves') {
    if (key === 'saves') setNotice(state.saves.includes(id) ? 'Removed from your saved inspiration.' : 'A little inspiration, saved for later.');
    mutate(previous => ({ ...previous, [key]: previous[key].includes(id) ? previous[key].filter(item => item !== id) : [...previous[key], id] }));
  }
  function openPost(post: CommunityPost, focus = false) { setDetail({ id: post.id, comments: focus }); window.history.replaceState(null, '', `${window.location.pathname}#post=${post.id}`); }
  function closePost() { setDetail(null); window.history.replaceState(null, '', window.location.pathname); }
  function resetFilters() { setQuery(''); setDestination(''); setTopic(''); setLimit(24); }
  function chooseTab(value: FeedTab) { setTab(value); resetFilters(); }
  function openProfile(id: string) { setProfile(id); setProfileName(state.profile.name); setProfileBio(state.profile.bio); setProfileError(''); }
  function share(post: CommunityPost) { setSharing(post); setCopied(false); }
  async function copyLink() {
    if (!sharing) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}/memories#post=${sharing.id}`); setCopied(true); }
    catch { setNotice('Copy the link from the field below.'); }
  }
  async function publish(post: CommunityPost) {
    const next = { ...state, posts: [post, ...state.posts] };
    await saveCommunity(next); setState(next); setStorageError(''); chooseTab('mine');
  }
  function closeComposer() { setComposer(null); if (tab === 'mine') requestAnimationFrame(() => document.getElementById('community-feed')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })); }
  const tabItems: { id: FeedTab; label: string }[] = [{ id: 'discover', label: 'Discover' }, { id: 'latest', label: 'Latest memories' }, { id: 'questions', label: 'Ask the island' }, { id: 'saved', label: 'Saved' }];
  return <div className="community-page">
    <Navbar memories />
    <div className="co-navbar-spacer" aria-hidden="true" />
    <main id="main">
      <section className="co-memories-hero" aria-labelledby="community-title">
        <MemoryFilm />
        <h1 id="community-title" className="co-visually-hidden">Island Memories. Little moments, lasting memories.</h1>
      </section>
      <div className="co-main">
      {storageError && <div className="co-storage-warning" role="alert">{storageError}<button onClick={() => void saveCommunity(state).then(() => { setStorageError(''); setNotice('Your journal is saved on this device.'); }).catch(() => setNotice('Storage is still unavailable. Please keep this tab open.'))}>Retry saving</button></div>}
      <div className="co-content-layout" id="community-feed">
        <div className="co-feed-introbar"><p className="co-eyebrow">THE MEMORY WALL</p><div><button className="co-header-create" aria-label="Share a memory" disabled={!ready} onClick={() => setComposer({ kind: 'moment' })}><Plus size={16} /><span>Share a memory</span></button><button className="co-profile-button" aria-label="Open your profile" onClick={() => openProfile('you')}><Avatar author={you} /></button></div></div>
        <section className="co-feed" aria-label="Traveller memories"><div className="co-feed-navigation"><div className="co-feed-tabs" role="group" aria-label="Browse memories">{tabItems.map(item => <button key={item.id} className={tab === item.id ? 'active' : ''} aria-pressed={tab === item.id} onClick={() => chooseTab(item.id)}>{item.id === 'saved' && <Bookmark size={14} />}{item.label}{item.id === 'saved' && savedCount > 0 && <span>{savedCount}</span>}</button>)}{tab === 'mine' && <button className="active" aria-pressed="true">My memories</button>}</div><button className={`co-filter-toggle co-icon-button ${showFilters ? 'active' : ''}`} aria-label="Toggle destination filters" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={19} /></button></div>
          <div className="co-feed-search"><Search size={17} /><input ref={searchRef} aria-label="Search stories, places, and experiences" value={query} onChange={event => { setQuery(event.target.value); setLimit(24); }} placeholder="A place, a feeling, a little inspiration…" />{query && <button className="co-icon-button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}<select className={showFilters ? 'co-select-open' : ''} aria-label="Filter by destination" value={destination} onChange={event => { setDestination(event.target.value); setLimit(24); }}><option value="">All destinations</option>{Array.from(new Set(posts.map(post => post.destination))).sort().map(place => <option key={place}>{place}</option>)}</select></div>
          <div className="co-topic-filters" role="group" aria-label="Filter by experience"><button aria-pressed={!topic} className={!topic ? 'active' : ''} onClick={() => { setTopic(''); setLimit(24); }}><Compass size={14} />A little of everything</button>{topics.map((item, index) => { const Icon = topicIcons[index]; return <button key={item} aria-pressed={topic === item} className={topic === item ? 'active' : ''} onClick={() => { setTopic(topic === item ? '' : item); setLimit(24); }}><Icon size={14} />{item}</button>; })}</div>
          <div className="co-feed-heading"><div><p className="co-eyebrow">{tab === 'saved' ? 'KEEP THE FEELING' : tab === 'mine' ? 'YOUR LITTLE CORNER' : tab === 'questions' ? 'GOOD QUESTIONS. LOCAL PERSPECTIVES.' : 'COLLECTED ALONG THE WAY'}</p><h2>{destination || (tab === 'saved' ? 'For a someday kind of day.' : tab === 'mine' ? 'Your island memories.' : tab === 'questions' ? 'Ask. Share. Find your way.' : 'Moments that stay with you.')}</h2></div><span className="co-result-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'memory' : 'memories'}</span></div>
          {tab === 'saved' && <div className="co-saved-note"><Bookmark size={20} /><p>Your favourite moments, all in one place.<span>Keep a little inspiration for your next Sri Lanka journey.</span></p><Link href="/plan">Start planning <ArrowUpRight size={16} /></Link></div>}
          {tab === 'mine' && <div className="co-mine-note"><p>A collection that could only be yours.</p><button onClick={() => setComposer({ kind: 'moment' })}><Plus size={15} />Add a moment</button></div>}
          {filtered.length ? <div className="co-post-grid">{filtered.slice(0, limit).map(post => <PostCard key={post.id} post={post} author={authorFor(post.authorId)} liked={state.likes.includes(post.id)} saved={state.saves.includes(post.id)} commentCount={comments.filter(comment => comment.postId === post.id).length} open={focus => openPost(post, focus)} like={() => toggle(post.id, 'likes')} save={() => toggle(post.id, 'saves')} profile={() => openProfile(post.authorId)} share={() => share(post)} />)}</div> : <div className="co-empty"><span><Compass size={39} strokeWidth={1} /></span><h3>{tab === 'saved' ? 'Leave a little room for inspiration.' : tab === 'mine' ? 'Every journal starts somewhere.' : 'A path still waiting to be found.'}</h3><p>{tab === 'saved' ? 'Tap the bookmark on a story you love. You’ll find it here, ready when you are.' : tab === 'mine' ? 'Share a photograph, tell a story, or ask the island a question.' : 'Try a different place or feeling. A good story is never far away.'}</p><button className="co-primary" onClick={() => { if (tab === 'mine') setComposer({ kind: 'moment' }); else if (tab === 'saved') chooseTab('discover'); else resetFilters(); }}>{tab === 'mine' ? 'Share your first moment' : tab === 'saved' ? 'Explore the journal' : 'Clear the filters'}<ArrowRight size={17} /></button></div>}
          {filtered.length > limit && <div className="co-more"><span>A little more of the island awaits.</span><button className="co-secondary" onClick={() => setLimit(value => value + 6)}>Keep wandering <ArrowDownIcon /></button></div>}
          {filtered.length > 0 && filtered.length <= limit && <p className="co-feed-end"><Sun size={18} strokeWidth={1} />You’ve reached the end of this little trail.</p>}
        </section>
      </div>
      <section className="co-bottom-invitation"><div><p className="co-eyebrow">FROM SOMEONE ELSE’S STORY TO YOUR OWN</p><h2>Found your kind of Sri Lanka?</h2><p>Let’s turn that feeling into a journey.</p></div><Link href="/plan" className="co-primary">Plan my journey <ArrowUpRight size={19} /></Link></section>
      </div>
    </main>
    <footer className="co-footer"><Link className="wordmark" href="/">hello<span>srilanka</span><span className="brand-period">.</span></Link><span>Your Sri Lanka. Your way.</span><div><button onClick={() => setGuidelines(true)}>Community spirit</button><Link href="/">Back to the island <ArrowUpRight size={13} /></Link></div></footer>
    <button className="co-mobile-compose" aria-label="Share your Sri Lanka" onClick={() => setComposer({ kind: 'moment' })} disabled={!ready}><Plus size={23} /></button>
    <AnimatePresence>{notice && <motion.div className="co-toast" role="status" initial={{ opacity: 0, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Check size={17} /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15} /></button></motion.div>}</AnimatePresence>
    {composer && <PostComposer close={closeComposer} publish={publish} name={state.profile.name} initialKind={composer.kind} initialTitle={composer.title} />}
    {selected && <PostDetail key={selected.id} post={selected} author={authorFor(selected.authorId)} comments={comments.filter(comment => comment.postId === selected.id)} liked={state.likes.includes(selected.id)} saved={state.saves.includes(selected.id)} like={() => toggle(selected.id, 'likes')} save={() => toggle(selected.id, 'saves')} addComment={body => { mutate(previous => ({ ...previous, comments: [...previous.comments, { id: crypto.randomUUID(), postId: selected.id, name: state.profile.name, body }] })); setNotice('Your thought has been added.'); }} close={closePost} share={() => share(selected)} report={() => { mutate(previous => ({ ...previous, hidden: [...previous.hidden, selected.id] })); closePost(); setNotice('Post hidden. Restore it from Community spirit.'); }} own={selected.authorId === 'you'} remove={() => { mutate(previous => ({ ...previous, posts: previous.posts.filter(post => post.id !== selected.id), comments: previous.comments.filter(comment => comment.postId !== selected.id), likes: previous.likes.filter(id => id !== selected.id), saves: previous.saves.filter(id => id !== selected.id) })); closePost(); setNotice('Post removed from your journal.'); }} focusComments={detail?.comments ?? false} />}
    {detail && !selected && ready && <CommunityDialog title="Story unavailable" close={closePost}><div className="co-empty"><Compass size={40} /><h2>This story isn’t on this trail.</h2><p>Personal preview posts are only available in the browser where they were created. The story may also have been deleted or hidden.</p><button className="co-primary" onClick={closePost}>Back to the journal</button></div></CommunityDialog>}
    {profileAuthor && <CommunityDialog title={profile === 'you' ? 'Your profile' : `${profileAuthor.name}’s journal`} close={() => setProfile(null)}><div className="co-profile-cover"><Image src={seedPosts[1].photos[0].src} alt="" fill sizes="600px" /><span>EVERY JOURNEY LEAVES A STORY.</span></div><div className="co-profile-content"><Avatar author={profileAuthor} /><p className="co-eyebrow">{profile === 'you' ? 'YOUR ISLAND MEMORIES' : 'ILLUSTRATIVE TRAVELLER PROFILE'}</p><h2>{profileAuthor.name}</h2><p className="co-profile-country"><MapPin size={14} />{profileAuthor.country}</p><p>{profileAuthor.bio}</p>{profile === 'you' ? <><form onSubmit={event => { event.preventDefault(); if (!profileName.trim()) { setProfileError('Add a name for your journal.'); return; } mutate(previous => ({ ...previous, profile: { name: profileName.trim(), bio: profileBio.trim() } })); setProfile(null); setNotice('Your memories, updated.'); }}><label className="co-label">Your display name<input required maxLength={40} value={profileName} onChange={event => setProfileName(event.target.value)} /></label><label className="co-label">A little about you<textarea rows={3} maxLength={240} value={profileBio} onChange={event => setProfileBio(event.target.value)} /></label>{profileError && <p className="co-form-error" role="alert">{profileError}</p>}<button className="co-primary">Save profile <Check size={16} /></button></form><button className="co-profile-journal-link" onClick={() => { setProfile(null); chooseTab('mine'); document.getElementById('community-feed')?.scrollIntoView({ behavior: 'instant' }); }}>Open my memories <span>{state.posts.length} posts</span><ArrowRight size={16} /></button><p className="co-field-note">Your profile and posts stay on this device. No account has been created.</p></> : <div className="co-profile-posts"><h3>From {profileAuthor.name.split(' ')[0]}’s journal</h3>{profilePosts.map(post => <button key={post.id} onClick={() => { setProfile(null); openPost(post); }}><span>{post.title}<small>{post.destination} · {post.kind}</small></span><ArrowUpRight size={17} /></button>)}</div>}</div></CommunityDialog>}
    {sharing && <CommunityDialog title="Share a story" close={() => setSharing(null)}><div className="co-share-panel"><p className="co-eyebrow">GOOD STORIES TRAVEL</p><h2>Pass the feeling on.</h2><p>{sharing.title}</p>{!sharing.sample && <p className="co-share-local">This is your device-local preview post. Its link opens only in this browser; it isn’t publicly published.</p>}<label className="co-label">Story link<input readOnly value={typeof window === 'undefined' ? '' : `${window.location.origin}/memories#post=${sharing.id}`} onFocus={event => event.target.select()} /></label><button className="co-primary" onClick={() => void copyLink()}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Link copied' : 'Copy story link'}</button></div></CommunityDialog>}
    {guidelines && <CommunityDialog title="Our community spirit" close={() => setGuidelines(false)}><div className="co-guidelines"><p className="co-eyebrow">A SHARED LOVE FOR A LITTLE ISLAND</p><h2>Come curious.<br />Leave a little kindness.</h2><p>This is a place for your perspective: the moments you loved, the things you learned, and the questions still on your mind.</p><ol><li><strong>Make it yours.</strong> Share your own photographs and words. Ask before sharing someone else’s face or personal details.</li><li><strong>Be generous with what you know.</strong> Say when you visited. Tell us what you experienced, and leave room for another perspective.</li><li><strong>Leave places better.</strong> Respect people, wildlife and local customs. Some quiet corners deserve to stay quiet.</li><li><strong>Keep the conversation kind.</strong> Helpful tips are welcome. Harassment, spam and undisclosed advertising aren’t.</li></ol><div className="co-preview-explanation"><strong>A note about this preview</strong><p>The travellers and stories are illustrative. Your posts, images, profile, comments, likes and saves live only in this browser. Report controls hide posts locally; there is no live moderation queue or shared account service yet.</p></div>{state.hidden.length > 0 && <button className="co-secondary co-restore-hidden" onClick={() => { mutate(previous => ({ ...previous, hidden: [] })); setNotice('Hidden stories are back in your feed.'); }}><Undo2 size={15} />Restore hidden stories ({state.hidden.length})</button>}<button className="co-primary" onClick={() => setGuidelines(false)}>Sounds like my kind of place <ArrowRight size={17} /></button></div></CommunityDialog>}
  </div>;
}
function ArrowDownIcon() { return <ArrowRight size={17} style={{ transform: 'rotate(90deg)' }} />; }
