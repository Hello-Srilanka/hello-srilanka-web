import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Preserve the supplied originals and their full frames; only resize and compress.
const directory = path.join(process.cwd(), 'public/images/community');
const output = path.join(directory, 'optimized');
await mkdir(output, { recursive: true });
const files = (await readdir(directory)).filter(file => /\.(jpe?g|png)$/i.test(file)).sort();
const photos = [];
for (const file of files) {
  const source = path.join(directory, file);
  const name = path.parse(file).name;
  const metadata = await sharp(source).rotate().metadata();
  const swapped = [5, 6, 7, 8].includes(metadata.orientation);
  const width = swapped ? metadata.height : metadata.width;
  const height = swapped ? metadata.width : metadata.height;
  for (const size of [480, 768, 1200, 1600, 2000]) {
    await sharp(source).rotate().resize({ width: size, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(output, `${name}-${size}.webp`));
  }
  await sharp(source).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(output, `${name}.webp`));
  photos.push({ source: file, src: `/images/community/optimized/${name}.webp`, width, height });
}
await writeFile(path.join(process.cwd(), 'lib/community/photos.json'), JSON.stringify(photos, null, 2) + '\n');
console.log(`Prepared ${photos.length} full-frame memories with responsive image sizes.`);
