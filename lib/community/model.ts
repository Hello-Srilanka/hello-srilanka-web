export type PostKind = 'moment' | 'story' | 'question';
export type Topic = 'Coastal' | 'Wild' | 'Flavourful' | 'Timeless' | 'Slow';
export type FeedTab = 'discover' | 'latest' | 'questions' | 'saved' | 'mine';
export type Author = { id: string; name: string; initials: string; color: string; country: string; bio: string };
export type CommunityPhoto = { src: string; alt: string; width?: number; height?: number; credit?: string; original?: string };
export type CommunityPost = {
  id: string; authorId: string; kind: PostKind; title: string; body: string;
  destination: string; topic: Topic; photos: CommunityPhoto[]; createdAt: string;
  visited: string; likes: number; readMinutes?: number; sample?: boolean;
};
export type CommunityComment = { id: string; postId: string; name: string; body: string; sample?: boolean };
export type CommunityState = {
  version: 1; posts: CommunityPost[]; likes: string[]; saves: string[];
  comments: CommunityComment[]; hidden: string[]; profile: { name: string; bio: string };
};
export const destinations = ['Sri Lanka', 'Ella', 'Galle', 'Hiriketiya', 'Kandy', 'Colombo', 'Sigiriya', 'Udawalawe', 'Nuwara Eliya', 'Mirissa', 'Arugam Bay', 'Negombo', 'Elsewhere in Sri Lanka'];
export const topics: Topic[] = ['Coastal', 'Wild', 'Flavourful', 'Timeless', 'Slow'];
export const emptyState: CommunityState = { version: 1, posts: [], likes: [], saves: [], comments: [], hidden: [], profile: { name: 'Island wanderer', bio: 'Collecting little moments around Sri Lanka.' } };

export function filterPosts(posts: CommunityPost[], filters: { tab: FeedTab; destination: string; topic: string; query: string; saved: string[]; hidden: string[] }) {
  const query = filters.query.trim().toLowerCase();
  const results = posts.filter(post => !filters.hidden.includes(post.id)
    && (filters.tab !== 'questions' || post.kind === 'question')
    && (filters.tab !== 'saved' || filters.saved.includes(post.id))
    && (filters.tab !== 'mine' || post.authorId === 'you')
    && (!filters.destination || post.destination === filters.destination)
    && (!filters.topic || post.topic === filters.topic)
    && (!query || `${post.title} ${post.body} ${post.destination} ${post.topic}`.toLowerCase().includes(query)));
  return filters.tab === 'latest' ? [...results].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : results;
}

export function validatePost(post: Pick<CommunityPost, 'kind' | 'title' | 'body' | 'destination' | 'photos'>) {
  if (post.title.trim().length < 5) return 'Give your post a title of at least 5 characters.';
  if (post.title.length > 100) return 'Keep your title under 100 characters.';
  if (post.body.trim().length < 10) return 'Add a little more detail — at least 10 characters.';
  if (post.body.length > 5000) return 'Keep your story under 5,000 characters.';
  if (!destinations.includes(post.destination)) return 'Choose where your story happened.';
  if (post.kind === 'moment' && !post.photos.length) return 'Add at least one photograph to your moment.';
  if (post.photos.length > 4) return 'Choose up to four photographs.';
  return '';
}

export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'IW'; }
