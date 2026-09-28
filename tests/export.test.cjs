/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults } = require('../lib/planner/model.ts');
const { sampleDraft } = require('../lib/planner/sample.ts');
const { finalize } = require('../lib/planner/validation.ts');
const { exportDocument, paginateExportBlocks } = require('../lib/planner/export-document.ts');
const preferences = { ...defaults, undecided: true, duration: 7, interests: ['Nature', 'Food'] };
const trip = () => finalize(sampleDraft(preferences), preferences, [], 'export-test', 'sample');

test('full export preserves every daily activity and stay; one-day export filters other days', () => {
  const itinerary = trip();
  const sections = exportDocument(itinerary, 'full', true);
  const days = sections.slice(1, -1);
  assert.equal(days.length, itinerary.days.length);
  itinerary.days.forEach((day, index) => {
    const blocks = days[index].blocks;
    day.items.forEach(item => assert.ok(blocks.some(block => block.title === item.title && block.paragraphs.includes(item.description))));
    if (day.stay) assert.ok(blocks.some(block => block.title === day.stay.name));
  });
  const selected = exportDocument(itinerary, 3, true);
  assert.equal(selected.length, 2);
  assert.equal(selected[0].title, 'Day 03.');
  assert.deepEqual(selected[0], days[2]);
  assert.throws(() => exportDocument(itinerary, 90, true), /Choose a day/);
  const notes = sections.at(-1).blocks.flatMap(block => block.paragraphs);
  itinerary.caveats.concat(itinerary.assumptions).forEach(note => assert.ok(notes.includes(note)));
});

test('cost toggle removes price details and cost-only references while retaining activity sources', () => {
  const itinerary = trip();
  itinerary.sources = [
    { id: 'activity-ref', title: 'Activity details', url: 'https://example.com/activity', retrievedAt: '2026-09-01' },
    { id: 'cost-ref', title: 'Cost details', url: 'https://example.com/cost', retrievedAt: '2026-09-01' },
    { id: 'unsafe-ref', title: 'Unsafe link', url: 'javascript:alert(1)', retrievedAt: '2026-09-01' },
  ];
  const item = itinerary.days[0].items[0];
  item.sourceIds = ['activity-ref', 'unsafe-ref'];
  item.cost = { ...item.cost, amount: 123, basis: 'unique-cost-basis', sourceIds: ['cost-ref'] };
  itinerary.knownCost = 123;
  const priced = JSON.stringify(exportDocument(itinerary, 1, true));
  assert.match(priced, /unique-cost-basis/);
  assert.match(priced, /https:\/\/example.com\/cost/);
  const unpriced = JSON.stringify(exportDocument(itinerary, 1, false));
  assert.doesNotMatch(unpriced, /unique-cost-basis|cost-ref|Costs to confirm|Known costs for the whole trip/);
  assert.match(unpriced, /https:\/\/example.com\/activity/);
  assert.doesNotMatch(unpriced, /javascript:|unsafe-ref/);
});

test('overview includes all daily highlights and labels partial whole-trip cost totals', () => {
  const itinerary = trip();
  itinerary.knownCost = 100;
  const sections = exportDocument(itinerary, 'overview', true);
  itinerary.days.forEach(day => assert.ok(sections[0].blocks.some(block => block.title === day.destination && block.paragraphs.includes(day.highlights))));
  assert.match(JSON.stringify(sections), /Known costs for the whole trip/);
  assert.match(JSON.stringify(sections), /partial subtotal/);
});

const wrap = text => text.match(/.{1,40}/g) || [];
test('pagination keeps cards that fit together and every page within its height', () => {
  const blocks = Array.from({ length: 5 }, (_, index) => ({ label: `DAY ${index}`, title: `Title ${index}`, paragraphs: ['A paragraph.', 'Another paragraph.'], kind: 'day' }));
  const pages = paginateExportBlocks(blocks, wrap, 500);
  assert.equal(pages.length, 3);
  assert.equal(pages.flat().length, blocks.length);
  for (const page of pages) assert.ok(page.reduce((sum, card) => sum + card.height, 0) + (page.length - 1) * 22 <= 500);
  assert.equal(pages.flat().some(card => card.label.includes('CONTINUED')), false);
});

test('pagination splits long content without losing or duplicating any lines', () => {
  const block = { label: 'EXPLORE', title: 'A very full day', paragraphs: Array.from({ length: 80 }, (_, index) => `Detail ${index}: ${'a'.repeat(100)}`), kind: 'activity' };
  const pages = paginateExportBlocks([block], wrap, 900);
  assert.ok(pages.length > 1);
  assert.ok(pages[1][0].label.endsWith('CONTINUED'));
  assert.deepEqual(pages.flat().flatMap(card => card.lines.map(line => line.text)), [block.title, ...block.paragraphs].flatMap(wrap));
  for (const page of pages) assert.ok(page.reduce((sum, card) => sum + card.height, 0) + (page.length - 1) * 22 <= 900);
});
