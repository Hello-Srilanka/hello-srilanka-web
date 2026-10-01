/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults } = require('../lib/planner/model.ts');
const { selectKnowledge } = require('../lib/knowledge/retrieval.ts');

const now = Date.parse('2026-09-25T00:00:00Z');
const p = { ...defaults, undecided: true, duration: 3, interests: ['Nature'] };
function fact(id, kind, destination, extra = {}) {
  return {
    id, kind, title: id, destination, related_destination: null, interests: [], months: [], duration_minutes: null,
    claim: `Reviewed fact about ${id}.`, source_url: `https://example.com/${id}`, provider_url: null,
    status: 'approved', retrieved_at: '2026-09-20T00:00:00Z', reviewed_at: '2026-09-20T00:00:00Z',
    expires_at: '2026-10-20T00:00:00Z', ...extra,
  };
}
const records = [
  fact('place', 'destination', 'Negombo'),
  fact('nature-1', 'activity', 'Negombo', { interests: ['Nature'] }),
  fact('nature-2', 'activity', 'Negombo', { interests: ['Nature'] }),
  fact('hotel', 'stay', 'Negombo', { provider_url: 'https://example.com/hotel' }),
  fact('season', 'season', 'Negombo'),
  fact('arrival', 'connection', p.arrival, { related_destination: 'Negombo' }),
  fact('departure', 'connection', 'Negombo', { related_destination: p.departure }),
];

test('approved, current single-base facts can replace a web research call', () => {
  const evidence = selectKnowledge(p, records, now);
  assert.equal(evidence.complete, true);
  assert.equal(evidence.sources.length, records.length);
  assert.match(evidence.text, /Reviewed fact about nature-1\. \[k\d+\]/);
  assert.equal(new Set(evidence.sources.map(source => source.id)).size, evidence.sources.length);
});

test('drafts, expired claims and irrelevant interests never enter the AI evidence', () => {
  const changed = records.map(record => record.id === 'nature-1' ? { ...record, status: 'draft' } : record.id === 'nature-2' ? { ...record, expires_at: '2026-09-24T00:00:00Z' } : record);
  changed.push(fact('beach', 'activity', 'Negombo', { interests: ['Beaches'] }));
  const evidence = selectKnowledge(p, changed, now);
  assert.equal(evidence.complete, false);
  assert.doesNotMatch(evidence.text, /nature-1|nature-2|beach/);
  assert.ok(evidence.sources.every(source => source.url.startsWith('https://')));
});

test('seasonal facts are sent only for matching travel months', () => {
  const seasonal = [fact('july-only', 'activity', 'Negombo', { months: [7] }), fact('year-round', 'activity', 'Negombo')];
  const evidence = selectKnowledge({ ...p, month: 'December' }, seasonal, now);
  assert.doesNotMatch(evidence.text, /july-only/);
  assert.match(evidence.text, /year-round/);
});
