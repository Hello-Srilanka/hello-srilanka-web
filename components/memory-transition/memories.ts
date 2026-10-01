import { authors, seedPosts } from '@/lib/community/data';
import type { CommunityPhoto, CommunityPost, Topic } from '@/lib/community/model';
import { createLandingSample } from '@/lib/planner/landing-sample';

// These bounds belong to the existing 1440 × 1920 customer export, not a
// second itinerary. Update them if the exported sample's layout changes.
const moments: { day: number; row: [number, number]; title: string; topic: Topic; photo: CommunityPhoto; postId?: string }[] = [
  { day: 1, row: [324, 118], title: 'Stay for the last of the light.', topic: 'Coastal', photo: { src: '/images/negombo-sunset.webp', alt: 'The last light over the water in Negombo', width: 1600, height: 1067 } },
  { day: 3, row: [608, 118], title: 'A morning above it all.', topic: 'Wild', photo: { src: '/images/sigiriya.webp', alt: 'Sigiriya rising above a green landscape', width: 1600, height: 1067 } },
  { day: 5, row: [932, 80], title: seedPosts[0].title, topic: seedPosts[0].topic, photo: seedPosts[0].photos[0], postId: seedPosts[0].id },
  { day: 6, row: [1052, 118], title: 'One more walk by the sea.', topic: 'Timeless', photo: { src: '/images/galle-lighthouse.webp', alt: 'Galle lighthouse beside palms and the coast', width: 1600, height: 1067 } },
];
const sample = createLandingSample();
export const itineraryMemories = moments.map(moment => {
  const day = sample.days.find(day => day.number === moment.day)!;
  const post: CommunityPost = {
    id: moment.postId ?? `sample-day-${day.number}`, authorId: 'maya', kind: 'moment', title: moment.title,
    body: '', destination: day.destination, topic: moment.topic, photos: [moment.photo],
    createdAt: '', visited: `Day ${day.number}`, likes: 0, sample: true,
  };
  return { post, day: day.number, row: moment.row, href: moment.postId ? `/memories#post=${moment.postId}` : '/memories' };
});
export const communityMemories = ['tea-country-voices', 'a-table-in-the-shade', 'steps-into-stillness', 'one-more-wave']
  .map(id => seedPosts.find(post => post.id === id)!);
export const memoryAuthor = (post: CommunityPost) => authors.find(author => author.id === post.authorId)!;
export const selectedMemory = itineraryMemories[2];
