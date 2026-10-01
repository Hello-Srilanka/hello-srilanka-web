import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const directory = path.resolve('public/images/map');
await mkdir(path.join(directory, 'thumbnails'), { recursive: true });
for (const filename of await readdir(directory)) {
  if (!filename.toLowerCase().endsWith('.png')) continue;
  await sharp(path.join(directory, filename))
    .resize({ width: 160, height: 160, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(directory, 'thumbnails', filename.replace(/\.png$/i, '.webp')));
}
