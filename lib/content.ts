export const experiences = [
 { name: 'Wild', detail: 'Mountains · Rainforests · Waterfalls', image: 'nuwara-tea-country', alt: 'Lush tea-covered hills in Sri Lanka', note: 'Take the path that disappears into green.', location: 'THE HILL COUNTRY' },
 { name: 'Coastal', detail: 'Beaches · Surf · Ocean', image: 'surf-hiriketiya', alt: 'A surfer riding a wave at Hiriketiya, Sri Lanka', note: 'Salt in your hair. Nowhere else to be.', location: 'HIRIKETIYA' },
 { name: 'Adventurous', detail: 'Hiking · Diving · Rafting', image: 'sigiriya', alt: 'Sigiriya rising above the surrounding Sri Lankan forest', note: 'Some views are worth the early start.', location: 'SIGIRIYA & BEYOND' },
 { name: 'Untamed', detail: 'Safari · Elephants · Whales', image: 'elephants-udawalawe', alt: 'Wild elephants and a calf in Udawalawe grassland', note: 'A world that moves to its own rhythm.', location: 'UDAWALAWE' },
 { name: 'Flavourful', detail: 'Street Food · Curry · Seafood', image: 'food-vendor', alt: 'A Sri Lankan street-food vendor cooking in a local kitchen', note: 'Follow your curiosity. And your appetite.', location: 'AT THE LOCAL TABLE' },
 { name: 'Timeless', detail: 'Heritage · Temples · Traditions', image: 'galle-lighthouse', alt: 'Galle lighthouse among palm trees at sunset', note: 'Ancient places. Stories still being written.', location: 'GALLE FORT' },
 { name: 'Alive', detail: 'Music · Nightlife · Social', image: 'negombo-sunset', alt: 'People gathering on Negombo beach at sunset', note: 'For the nights that become the stories.', location: 'AFTER THE SUN GOES DOWN' },
 { name: 'Local', detail: 'Markets · Villages · Everyday Sri Lanka', image: 'market-life', alt: 'Shoppers and a tuk-tuk at a Sri Lankan roadside produce market', note: 'The best moments rarely come with a map.', location: 'EVERYDAY SRI LANKA' },
 { name: 'Slow', detail: 'Wellness · Tea Country · Quiet Escapes', image: 'nuwara-tea-pickers', alt: 'Workers among rolling tea fields in Nuwara Eliya', note: 'A little less doing. A little more being.', location: 'NUWARA ELIYA' },
] as const;
export const storyScenes = [
 { ...experiences[3], name: 'Wild', image: '/images/story/Wild.jpg', alt: 'Leopard resting on a tree branch in Sri Lankan woodland', location: 'THE WILDS', detail: 'Safari · Wildlife · Wild Landscapes' },
 { ...experiences[1], image: '/images/story/Coastal.jpg', alt: 'Surfer carrying a board into a golden coastal sunset', location: 'THE COAST' },
 { ...experiences[4], image: '/images/story/Favourfull.jpg', alt: 'Cook chopping ingredients on a hot griddle in a Sri Lankan kitchen' },
 { ...experiences[5], image: '/images/story/Timeless.jpg', alt: 'Traditional stilt fishers silhouetted against an orange sunset', note: 'Old rhythms. Stories still being written.', detail: 'Heritage · Traditions · Living Ways', location: 'LIVING TRADITIONS' },
 { ...experiences[8], image: '/images/story/Slow.jpg', alt: 'Train crossing a stone bridge through Sri Lanka’s green hill country', detail: 'Scenic Journeys · Tea Country · Quiet Escapes', location: 'THE HILL COUNTRY' },
];
export const journeys = [
 { title: 'The adventurer', image: 'sigiriya', alt: 'Sigiriya rock fortress surrounded by forest', feeling: 'Chase the feeling.', route: ['Sigiriya', 'Knuckles', 'Ella', 'Arugam Bay'], details: 'Hiking · Surfing · Waterfalls · Sunrise climbs', intro: 'Up before the island wakes. One more trail. One more wave. The kind of tired you came for.', color: 'saffron' },
 { title: 'The slow traveller', image: 'train-person', alt: 'A traveller taking in the view from a Sri Lankan train', feeling: 'Take the long way.', route: ['Kandy', 'Nuwara Eliya', 'Ella', 'Mirissa'], details: 'Scenic trains · Tea country · Long breakfasts · Beach sunsets', intro: 'A window seat through the hills. Tea that turns into an afternoon. Nothing on the horizon but time.', color: 'ocean' },
 { title: 'The wildlife lover', image: 'elephants-udawalawe', alt: 'Wild elephants and their calf in Udawalawe', feeling: 'Let the wild find you.', route: ['Wilpattu', 'Sigiriya', 'Udawalawe', 'Yala'], details: 'Safaris · Elephants · Birds · Wild landscapes', intro: 'An early start, a quiet jeep, and a world waking up around you. Make room for the unexpected.', color: 'jungle' },
 { title: 'The food explorer', image: 'market-life', alt: 'People choosing produce at a Sri Lankan market', feeling: 'Go where it tastes good.', route: ['Colombo', 'Kandy', 'Galle', 'South Coast'], details: 'Markets · Home cooking · Street food · Seafood', intro: 'A market morning. A recipe passed down. An invitation to pull up a chair. Discover the island one table at a time.', color: 'cinnamon' },
] as const;
