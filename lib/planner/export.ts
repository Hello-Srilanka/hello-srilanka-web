import { dayDate, dateLabel, money, tripDates, type Itinerary } from './model';
export type ExportImage = { url: string; label: string; filename: string; width: number; height: number };
type Block = { title: string; body: string; accent?: boolean };
export async function createExport(t: Itinerary, selected: number | 'overview', costs: boolean): Promise<ExportImage[]> {
  // A text-first layout avoids cross-origin images and keeps mobile downloads reliable.
  // Font readiness is bounded: fall back cleanly to the system font if it cannot load.
  let font = 'Arial';
  try {
    await Promise.race([document.fonts.load('400 32px "DM Sans Variable"'), new Promise((_, reject) => setTimeout(() => reject(new Error('font timeout')), 4000))]);
    if (document.fonts.check('400 32px "DM Sans Variable"')) font = '"DM Sans Variable", Arial';
  } catch { /* System text is the intended fallback. */ }
  const width = 1440, height = 1920, margin = 100, contentWidth = width - margin * 2;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('Image export is unavailable in this browser. Try another browser.');
  function wrap(text: string, size: number, bold = false) {
    measure!.font = `${bold ? 700 : 400} ${size}px ${font}`;
    const lines: string[] = []; let line = '';
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (measure!.measureText(next).width <= contentWidth) { line = next; continue; }
      if (line) lines.push(line); line = '';
      // Break long URLs or uninterrupted strings without clipping.
      for (const char of word) {
        if (measure!.measureText(line + char).width > contentWidth) { lines.push(line); line = char; }
        else line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  const costText = (amount: number | null, basis: string) => costs ? ` · ${amount === null ? 'Check price and availability' : money(amount, t.preferences.currency) + ' estimated for group · ' + basis}` : '';
  const blocks: Block[] = [];
  const days = selected === 'overview' ? t.days : t.days.filter(d => d.number === selected);
  for (const day of days) {
    const date = dayDate(t.preferences, day.number - 1);
    blocks.push({ title: `DAY ${day.number}${date ? ' · ' + dateLabel(date) : ''} / ${day.destination}`, body: selected === 'overview' ? `${day.highlights}. ${day.items.map(i => i.title).join(' · ')}. ${day.overnight ? 'Overnight: ' + day.overnight : 'Departure: ' + day.endLocation}` : day.highlights, accent: true });
    if (selected !== 'overview') {
      for (const item of day.items) blocks.push({ title: `${item.period} · ${item.title}`, body: `${item.description}${item.kind === 'transport' ? ` ${item.from} → ${item.to}.` : ''} ${item.durationMinutes === null ? 'Duration to confirm.' : `Allow approximately ${item.durationMinutes} min${item.bufferMinutes ? ` + ${item.bufferMinutes} min buffer` : ''}.`}${costText(item.cost.amount, item.cost.basis)}` });
      if (day.stay) blocks.push({ title: `Overnight · ${day.overnight}`, body: `${day.stay.name}. ${day.stay.description}${costText(day.stay.cost.amount, day.stay.cost.basis)}` });
    }
  }
  if (costs) blocks.push({ title: 'ESTIMATES, WITH A LITTLE CONTEXT', body: `${t.knownCost === null ? 'No supported price estimate is available.' : `Known trip costs: ${money(t.knownCost, t.preferences.currency)} for the group; a partial subtotal, not a full budget.`} Major unknowns: ${t.unknownCosts.join('; ')}. Check price and availability before booking.` });
  blocks.push({ title: 'BEFORE YOU GO', body: t.mode === 'sample' ? 'SAMPLE ONLY · Illustrative route. No live research, prices or availability. Confirm every activity, transfer and stay.' : 'A researched plan, not a booking. Flexible timings and estimates require confirmation. See the saved itinerary for source links and practical caveats.' });
  type Line = { text: string; size: number; bold: boolean; color: string; gap: number };
  const lines: Line[] = [];
  for (const block of blocks) {
    for (const text of wrap(block.title, 32, true)) lines.push({ text, size: 32, bold: true, color: block.accent ? '#a84d35' : '#12372a', gap: 44 });
    for (const text of wrap(block.body, 29)) lines.push({ text, size: 29, bold: false, color: '#33433a', gap: 42 });
    lines.push({ text: '', size: 1, bold: false, color: '', gap: 34 });
  }
  const titleLines = wrap(selected === 'overview' ? 'YOUR SRI LANKA, DAY BY DAY.' : `A CLOSER LOOK AT DAY ${selected}.`, 50, true);
  const dateLines = wrap(tripDates(t.preferences), 27);
  const top = 220 + titleLines.length * 64 + dateLines.length * 40;
  const capacity = height - 140 - top;
  const pages: Line[][] = []; let page: Line[] = [], used = 0;
  // Keep a heading with at least one body line, and paginate at full readable size.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const needed = line.gap + (line.bold && lines[i + 1] ? lines[i + 1].gap : 0);
    if (used + needed > capacity && page.length) { pages.push(page); page = []; used = 0; }
    if (!page.length && !line.text) continue;
    page.push(line); used += line.gap;
  }
  if (page.length) pages.push(page);
  const output: ExportImage[] = [];
  try {
    for (let i = 0; i < pages.length; i++) {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not prepare the image.');
      ctx.fillStyle = '#f5f0e6'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#12372a'; ctx.fillRect(0, 0, width, 20);
      ctx.textBaseline = 'top'; ctx.font = `700 31px ${font}`; ctx.fillText('hellosrilanka.', margin, 82);
      ctx.font = `400 20px ${font}`; ctx.fillText(t.mode === 'sample' ? 'SAMPLE ITINERARY' : 'YOUR SRI LANKA. YOUR WAY.', margin, 131);
      let y = 202;
      ctx.font = `700 50px ${font}`;
      for (const line of titleLines) { ctx.fillText(line, margin, y); y += 64; }
      ctx.font = `400 27px ${font}`;
      for (const line of dateLines) { ctx.fillText(line, margin, y); y += 40; }
      y = top;
      for (const line of pages[i]) {
        ctx.fillStyle = line.color; ctx.font = `${line.bold ? 700 : 400} ${line.size}px ${font}`;
        if (line.text) ctx.fillText(line.text, margin, y); y += line.gap;
      }
      ctx.strokeStyle = '#d4d4c9'; ctx.beginPath(); ctx.moveTo(margin, height - 110); ctx.lineTo(width - margin, height - 110); ctx.stroke();
      ctx.fillStyle = '#526255'; ctx.font = `400 22px ${font}`; ctx.fillText('A little island. An endless feeling.', margin, height - 80);
      ctx.textAlign = 'right'; ctx.fillText(`${i + 1} / ${pages.length}`, width - margin, height - 80);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image creation failed. Please retry.')), 'image/png'));
      output.push({ url: URL.createObjectURL(blob), filename: `HelloSriLanka-${selected === 'overview' ? 'overview' : 'day-' + selected}-${i + 1}.png`, label: `${selected === 'overview' ? 'Trip overview' : 'Day ' + selected} · Image ${i + 1} of ${pages.length}`, width, height });
    }
    return output;
  } catch (error) { output.forEach(p => URL.revokeObjectURL(p.url)); throw error; }
}
