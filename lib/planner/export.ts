import type { Itinerary } from './model';
import { exportDocument, paginateExportBlocks, type ExportSelection, type ExportBlock } from './export-document';
export type { ExportSelection } from './export-document';
export type ExportImage = { url: string; label: string; filename: string; width: number; height: number };

const palette = { ink: '#12372a', cream: '#f5f0e6', muted: '#526255', saffron: '#e99a3e', line: '#d4dacb' };
const fills: Record<ExportBlock['kind'], string> = { intro: '#e4eada', day: '#e4eada', activity: '#fffcf6', transport: '#eaf0ef', stay: '#f1e6d6', note: '#efede4' };

function wordmark(ctx: CanvasRenderingContext2D, x: number, y: number, font: string) {
  ctx.fillStyle = palette.cream;
  for (const [text, weight] of [['hello', 450], ['srilanka', 800]] as const) {
    ctx.font = `${weight} 45px ${font}`;
    for (const character of text) { ctx.fillText(character, x, y); x += ctx.measureText(character).width - 1.8; }
  }
  ctx.fillStyle = palette.saffron;
  ctx.beginPath(); ctx.arc(x + 6, y + 35, 5, 0, Math.PI * 2); ctx.fill();
}

export async function createExport(t: Itinerary, selected: ExportSelection, costs: boolean, signal?: AbortSignal): Promise<ExportImage[]> {
  let font = 'Arial';
  let fontTimer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('400 28px "DM Sans Variable"'), document.fonts.load('800 45px "DM Sans Variable"')]),
      new Promise((_, reject) => { fontTimer = setTimeout(() => reject(new Error('font timeout')), 4000); }),
    ]);
    if (document.fonts.check('400 28px "DM Sans Variable"')) font = '"DM Sans Variable", Arial';
  } catch { /* Use a legible system font when the brand font cannot load. */ }
  finally { clearTimeout(fontTimer); }
  signal?.throwIfAborted();
  const width = 1440, height = 1920, margin = 88, contentWidth = width - margin * 2, cardPadding = 28;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('Image export is unavailable in this browser. Try another browser.');
  function wrap(text: string, size: number, bold = false, available = contentWidth - cardPadding * 2) {
    measure!.font = `${bold ? 700 : 400} ${size}px ${font}`;
    const lines: string[] = []; let line = '';
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (measure!.measureText(next).width <= available) { line = next; continue; }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && measure!.measureText(line + char).width > available) { lines.push(line); line = char; }
        else line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  const documents = exportDocument(t, selected, costs).flatMap(section => {
    const subtitle = wrap(section.subtitle, 25, false, contentWidth);
    const headerHeight = 260 + subtitle.length * 36;
    const top = headerHeight + 36;
    return paginateExportBlocks(section.blocks, wrap, height - 140 - top).map(cards => ({ section, subtitle, headerHeight, top, cards }));
  });
  const output: ExportImage[] = [];
  try {
    for (const [index, page] of documents.entries()) {
      signal?.throwIfAborted();
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not prepare the image.');
      ctx.fillStyle = palette.cream; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = palette.ink; ctx.fillRect(0, 0, width, page.headerHeight);
      ctx.strokeStyle = '#335640'; ctx.lineWidth = 2;
      for (const radius of [90, 140, 190]) { ctx.beginPath(); ctx.arc(width - 60, 40, radius, 0, Math.PI * 2); ctx.stroke(); }
      ctx.textBaseline = 'top'; wordmark(ctx, margin, 56, font);
      ctx.fillStyle = '#e7c58a'; ctx.font = `700 20px ${font}`; ctx.textAlign = 'right';
      ctx.fillText(t.mode === 'sample' ? 'SAMPLE TRAVEL JOURNAL' : 'YOUR ISLAND JOURNAL', width - margin, 73);
      ctx.textAlign = 'left'; ctx.fillStyle = palette.cream; ctx.font = `700 60px ${font}`;
      ctx.fillText(page.section.title, margin, 150);
      ctx.font = `400 25px ${font}`; ctx.fillStyle = '#d6dfcb';
      page.subtitle.forEach((line, i) => ctx.fillText(line, margin, 232 + i * 36));
      let y = page.top;
      for (const card of page.cards) {
        ctx.fillStyle = fills[card.kind]; ctx.strokeStyle = palette.line; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(margin, y, contentWidth, card.height, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = card.kind === 'transport' ? '#507574' : '#a36538';
        ctx.fillRect(margin, y + 26, 5, Math.min(card.height - 52, 64));
        let lineY = y + cardPadding;
        ctx.font = `700 20px ${font}`;
        for (const line of wrap(card.label, 20, true)) { ctx.fillText(line, margin + cardPadding, lineY); lineY += 28; }
        lineY += 12;
        for (const line of card.lines) {
          ctx.fillStyle = line.bold ? palette.ink : '#3e5144';
          ctx.font = `${line.bold ? 700 : 400} ${line.size}px ${font}`;
          ctx.fillText(line.text, margin + cardPadding, lineY); lineY += line.height;
        }
        y += card.height + 22;
      }
      ctx.strokeStyle = palette.line; ctx.beginPath(); ctx.moveTo(margin, height - 110); ctx.lineTo(width - margin, height - 110); ctx.stroke();
      ctx.fillStyle = palette.muted; ctx.font = `400 22px ${font}`;
      ctx.fillText(t.mode === 'sample' ? 'Sample only · Confirm all travel details.' : 'A researched plan · Confirm details before booking.', margin, height - 80);
      ctx.textAlign = 'right'; ctx.font = `700 22px ${font}`; ctx.fillText(`${index + 1} / ${documents.length}`, width - margin, height - 80);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image creation failed. Please retry.')), 'image/png'));
      signal?.throwIfAborted();
      const name = typeof selected === 'number' ? `day-${selected}` : selected;
      output.push({ url: URL.createObjectURL(blob), filename: `HelloSriLanka-${name}-${String(index + 1).padStart(2, '0')}.png`, label: `${page.section.title} · Page ${index + 1} of ${documents.length}`, width, height });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return output;
  } catch (error) { output.forEach(page => URL.revokeObjectURL(page.url)); throw error; }
}
