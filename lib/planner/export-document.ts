import { dayDate, dateLabel, money, tripDates, travellers, type Itinerary } from './model';
import { safeUrl } from './validation';

export type ExportSelection = 'overview' | 'full' | number;
export type ExportBlock = { label: string; title: string; paragraphs: string[]; kind: 'intro' | 'day' | 'activity' | 'transport' | 'stay' | 'note' };
export type ExportSection = { title: string; subtitle: string; blocks: ExportBlock[] };
export type ExportLine = { text: string; size: number; bold: boolean; height: number };
export type ExportCard = { label: string; kind: ExportBlock['kind']; lines: ExportLine[]; height: number };

export function exportDocument(t: Itinerary, selection: ExportSelection, costs: boolean): ExportSection[] {
  const selectedDays = typeof selection === 'number' ? t.days.filter(day => day.number === selection) : t.days;
  if (!selectedDays.length) throw new Error('Choose a day from this itinerary.');
  const subtitle = `${tripDates(t.preferences)} · ${travellers(t.preferences)} · ${t.preferences.pace} pace`;
  const sourceIds = new Set<string>();
  const references = (ids: string[]) => {
    const known = [...new Set(ids)].filter(id => t.sources.some(source => source.id === id && safeUrl(source.url)));
    known.forEach(id => sourceIds.add(id));
    return known.length ? `Sources: ${known.join(', ')}` : '';
  };
  const cost = (value: Itinerary['days'][number]['items'][number]['cost']) => !costs ? '' : value.amount === null
    ? 'Price and availability to confirm.'
    : `${money(value.amount, t.preferences.currency)} estimated for the group. ${value.basis}`;
  const sections: ExportSection[] = [];
  if (typeof selection !== 'number') {
    const route = t.days.map(day => day.destination).filter((place, index, all) => !index || place !== all[index - 1]);
    const blocks: ExportBlock[] = [{ label: 'YOUR ISLAND JOURNAL', title: t.title, paragraphs: [t.summary, `Route: ${route.join(' → ')}`], kind: 'intro' }];
    if (selection === 'overview') for (const day of t.days) {
      const date = dayDate(t.preferences, day.number - 1);
      blocks.push({ label: `DAY ${String(day.number).padStart(2, '0')}${date ? ' · ' + dateLabel(date) : ''}`, title: day.destination,
        paragraphs: [day.highlights, ...day.items.map(item => `${item.period} · ${item.title}`), day.overnight ? `Tonight: ${day.overnight}` : `Departure: ${day.endLocation}`], kind: 'day' });
    }
    sections.push({ title: selection === 'overview' ? 'Your trip at a glance.' : 'Your Sri Lanka journal.', subtitle, blocks });
  }
  if (selection !== 'overview') for (const day of selectedDays) {
    const date = dayDate(t.preferences, day.number - 1);
    const blocks: ExportBlock[] = [{ label: date ? dateLabel(date) : 'YOUR DAILY CHAPTER', title: day.destination,
      paragraphs: [day.highlights, `${day.startLocation} → ${day.endLocation}`], kind: 'day' }];
    for (const item of day.items) blocks.push({ label: `${item.period.toUpperCase()} · ${item.kind === 'transport' ? 'ON THE WAY' : 'EXPLORE'}`, title: item.title, kind: item.kind,
      paragraphs: [item.description, item.kind === 'transport' ? `${item.from} → ${item.to}` : '',
        item.durationMinutes === null ? 'Journey time to confirm.' : `Allow approximately ${item.durationMinutes} min${item.bufferMinutes ? ` + ${item.bufferMinutes} min buffer` : ''}.`,
        cost(item.cost), references([...item.sourceIds, ...(costs ? item.cost.sourceIds : [])])].filter(Boolean) });
    if (day.stay) blocks.push({ label: `TONIGHT · ${day.overnight}`, title: day.stay.name, kind: 'stay',
      paragraphs: [day.stay.description, cost(day.stay.cost), references([...(day.stay.sourceId ? [day.stay.sourceId] : []), ...(costs ? day.stay.cost.sourceIds : [])])].filter(Boolean) });
    else blocks.push({ label: 'ONWARD JOURNEY', title: day.endLocation, paragraphs: ['No overnight stay planned. Confirm your departure arrangements.'], kind: 'note' });
    sections.push({ title: `Day ${String(day.number).padStart(2, '0')}.`, subtitle, blocks });
  }
  const notes: ExportBlock[] = [];
  if (costs) notes.push({ label: 'ESTIMATES', title: 'A little cost context.', kind: 'note', paragraphs: [
    t.knownCost === null ? 'No supported price total is available.' : `Known costs for the whole trip: ${money(t.knownCost, t.preferences.currency)} for the group. This is a partial subtotal, not a complete trip budget.`,
    t.unknownCosts.length ? `Costs to confirm: ${t.unknownCosts.join('; ')}.` : '',
    'International flights are excluded. Confirm prices and availability before booking.',
  ].filter(Boolean) });
  notes.push({ label: t.mode === 'sample' ? 'SAMPLE ITINERARY' : 'TRAVEL NOTES', title: 'Before you go.', kind: 'note', paragraphs: [
    t.mode === 'sample' ? 'Illustrative ideas only. Routes, prices and availability have not been verified.' : 'A researched plan, not a booking. Flexible timings and estimates need confirmation.',
    ...t.caveats,
  ] });
  if (selection !== 'overview' && t.assumptions.length) notes.push({ label: 'CONTEXT', title: 'What this plan assumes.', paragraphs: t.assumptions, kind: 'note' });
  if (selection !== 'overview') for (const source of t.sources.filter(source => sourceIds.has(source.id))) {
    notes.push({ label: `SOURCE ${source.id}`, title: source.title, paragraphs: [source.url, source.retrievedAt ? `Retrieved: ${source.retrievedAt}` : 'Retrieval date unavailable.'], kind: 'note' });
  }
  sections.push({ title: 'Good to keep in mind.', subtitle, blocks: notes });
  return sections;
}

// Layout uses the real canvas font measurements. Whole cards stay together when
// possible; unusually long content continues on another card at readable size.
export function paginateExportBlocks(blocks: ExportBlock[], wrap: (text: string, size: number, bold: boolean) => string[], capacity: number): ExportCard[][] {
  const pages: ExportCard[][] = [];
  let page: ExportCard[] = [], used = 0;
  const gap = 22, padding = 56, labelLineHeight = 28;
  const flush = () => { if (page.length) pages.push(page); page = []; used = 0; };
  for (const block of blocks) {
    const lines: ExportLine[] = [
      ...wrap(block.title, 34, true).map(text => ({ text, size: 34, bold: true, height: 46 })),
      ...block.paragraphs.flatMap(paragraph => wrap(paragraph, 28, false).map((text, index) => ({ text, size: 28, bold: false, height: index === 0 ? 47 : 39 }))),
    ];
    let remaining = lines, continuation = false;
    while (remaining.length) {
      const label = `${block.label}${continuation ? ' · CONTINUED' : ''}`;
      const overhead = padding + wrap(label, 20, true).length * labelLineHeight + 12;
      const total = overhead + remaining.reduce((sum, line) => sum + line.height, 0);
      if (page.length && total > capacity - used) flush();
      let count = 0, height = overhead;
      while (count < remaining.length && height + remaining[count].height <= capacity - used) height += remaining[count++].height;
      if (!count) throw new Error('This itinerary contains a heading too long to export.');
      page.push({ label, kind: block.kind, lines: remaining.slice(0, count), height });
      used += height + gap;
      remaining = remaining.slice(count);
      continuation = true;
      if (remaining.length) flush();
    }
  }
  flush();
  return pages;
}
