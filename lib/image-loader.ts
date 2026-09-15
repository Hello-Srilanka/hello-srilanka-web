import type { ImageLoaderProps } from 'next/image';
/** Static, pre-optimized responsive assets: no image server or external service. */
export default function imageLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith('/images/') || !src.endsWith('.webp')) return src;
  const sizes = [480, 768, 1200, 1600, 2000];
  const size = sizes.find(candidate => candidate >= width) ?? 2000;
  return src.replace('.webp', `-${size}.webp`);
}
