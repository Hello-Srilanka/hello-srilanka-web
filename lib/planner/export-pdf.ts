import type { ExportImage } from './export';

/** Bind the already-rendered journal pages into a single, print-sized document. */
export async function createExportPdf(images: ExportImage[], signal?: AbortSignal): Promise<Blob> {
  if (!images.length) throw new Error('There are no pages to save yet.');
  const { PDFDocument } = await import('pdf-lib');
  signal?.throwIfAborted();
  const document = await PDFDocument.create();
  document.setTitle('My HelloSriLanka journey');
  document.setAuthor('HelloSriLanka');
  document.setCreator('HelloSriLanka travel planner');
  for (const image of images) {
    signal?.throwIfAborted();
    const response = await fetch(image.url, { signal });
    if (!response.ok) throw new Error('A journal page could not be opened. Please try again.');
    const png = await document.embedPng(await response.arrayBuffer());
    const width = 540;
    const height = width * image.height / image.width;
    const page = document.addPage([width, height]);
    page.drawImage(png, { x: 0, y: 0, width, height });
  }
  signal?.throwIfAborted();
  const bytes = await document.save();
  signal?.throwIfAborted();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}
