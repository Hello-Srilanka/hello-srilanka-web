export type CultureArtworkType = 'ayurveda' | 'perahera' | 'dance' | 'craft' | 'tea' | 'festival';
export type CultureChapter = {
  id: CultureArtworkType;
  number: string;
  keyword: string;
  name: string;
  title: readonly string[];
  subtitle: string;
  description: string;
  caption: string;
  theme: 'light' | 'dark';
};

export const cultureChapters: readonly CultureChapter[] = [
  { id: 'ayurveda', number: '01', keyword: 'HEAL', name: 'Sri Lankan Ayurveda & wellness', title: ['A SLOWER RHYTHM', 'FOR BODY', 'AND MIND.'], subtitle: 'Herbs. Oils. Ritual. Rest.', description: 'Botanical preparations and oils are part of Sri Lanka’s Ayurvedic tradition. A moment to pause, and pay attention.', caption: 'AYURVEDA / OIL / REST', theme: 'light' },
  { id: 'perahera', number: '02', keyword: 'CELEBRATE', name: 'Kandy Esala Perahera', title: ['A NIGHT OF', 'RHYTHM', 'AND LIGHT.'], subtitle: 'The streets of Kandy, alive with devotion.', description: 'Drummers, dancers and torchlight accompany Kandy’s annual procession honouring the Sacred Tooth Relic of the Buddha.', caption: 'KANDY / PROCESSION / TORCHLIGHT', theme: 'dark' },
  { id: 'dance', number: '03', keyword: 'MOVE', name: 'Sri Lankan dance & drumming', title: ['THE ISLAND', 'HAS ITS OWN', 'RHYTHM.'], subtitle: 'A gesture. A beat. A story in motion.', description: 'One of Sri Lanka’s distinct dance traditions, Kandyan dance is accompanied by the geta bera, a drum played by hand.', caption: 'DANCE / COSTUME / RHYTHM', theme: 'light' },
  { id: 'craft', number: '04', keyword: 'MAKE', name: 'Sri Lankan crafts & art', title: ['STORIES', 'MADE', 'BY HAND.'], subtitle: 'A pattern. A carving. The maker’s touch.', description: 'From patterned cloth to painted masks and carved wood, patient hands give everyday materials a new life.', caption: 'CLOTH / COLOUR / CARVING', theme: 'light' },
  { id: 'tea', number: '05', keyword: 'TASTE', name: 'Ceylon tea, spice & cuisine', title: ['GROWN HERE.', 'SHARED', 'HERE.'], subtitle: 'From a hillside leaf to a shared table.', description: 'Ceylon tea. The fragrance of cinnamon. Spices woven into Sri Lankan cooking, and the pleasure of making room for one more.', caption: 'TEA COUNTRY / PEOPLE / PLACE', theme: 'light' },
  { id: 'festival', number: '06', keyword: 'GLOW', name: 'Festivals & living traditions', title: ['TRADITIONS', 'STILL', 'LIVED.'], subtitle: 'A lamp lit. A lantern raised. A moment shared.', description: 'Light, colour and the people who keep traditions alive. Across the island, celebrations carry their own stories.', caption: 'LIGHT / COLOUR / COMMUNITY', theme: 'dark' },
];

