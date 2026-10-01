import { cultureChapters } from './chapters';
import { cultureImages } from './images';

export const cultureBlend = .018;
const counts = cultureChapters.map(chapter => cultureImages[chapter.id].length);
const weights = counts.map(count => 1 + (count - 1) * .8);
const total = weights.reduce((sum, weight) => sum + weight, 0);
export const cultureBoundaries = [.08];
weights.forEach(weight => cultureBoundaries.push(cultureBoundaries.at(-1)! + .86 * weight / total));
export const culturePhotoRanges = counts.map((count, i) => ({
  count, start: cultureBoundaries[i] + cultureBlend, end: cultureBoundaries[i + 1] - cultureBlend,
}));
// Chapter links enter the first photograph rather than skipping to the middle.
export const cultureStops = [0, ...culturePhotoRanges.map(({ start, end, count }) => start + (end - start) / count / 2), 1];
export const cultureScrollScreens = 4.8 + (counts.reduce((sum, count) => sum + count, 0) - counts.length) * .4;
export function culturePhotoIndex(progress: number, chapter: number) {
  const { start, end, count } = culturePhotoRanges[chapter];
  return Math.max(0, Math.min(count - 1, Math.floor((progress - start) / (end - start) * count)));
}
