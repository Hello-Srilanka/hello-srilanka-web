import type { CultureArtworkType } from './chapters';

export type CultureImage = { file: string; alt: string; position?: string };
export const cultureImages: Record<CultureArtworkType, readonly CultureImage[]> = {
  ayurveda: [{ file: 'Ayurveda & Wellness.jpg', alt: 'An Ayurvedic practitioner tending a suspended oil vessel above a reclining guest' }],
  perahera: [{ file: 'Kandy Esala Perahera.jpg', alt: 'An illuminated Kandy Esala Perahera procession moving through the street at night' }],
  dance: [
    { file: 'Traditional Dance & Drumming.jpg', alt: 'A traditionally dressed dancer performing at night' },
    { file: 'Traditional Dance & Drumming - 2.jpg', alt: 'Costumed performers with an elaborate mask on a dark stage' },
  ],
  craft: [
    { file: 'Craft & Art.jpg', alt: 'An artisan painting a colourful carved wooden mask' },
    { file: 'Craft & Art - 2.jpg', alt: 'A collection of colourful carved masks displayed on a wall' },
    { file: 'Craft & Art - 3.jpg', alt: 'An artisan applying a detailed pattern to fabric' },
    { file: 'Craft & Art - 4.jpg', alt: 'Hands weaving an intricate red and cream pattern' },
    { file: 'Craft & Art - 5.jpg', alt: 'Hands carving decorative motifs into a round wooden object' },
  ],
  tea: [{ file: 'Tea, Spice & Cuisine.jpg', alt: 'A tea worker standing among tea bushes in the green hill country' }],
  festival: [
    { file: 'Festivals & Living Traditions.jpg', alt: 'A hand lighting a row of small oil lamps' },
    { file: 'Festivals & Living Traditions-2.jpg', alt: 'A child reaching towards a glowing lantern among hanging lights' },
    { file: 'Festivals & Living Traditions.png', alt: 'Colourful illuminated lantern decorations seen from below' },
  ],
};

export const cultureImageSrc = (file: string) => `/images/culture/${encodeURIComponent(file)}`;
