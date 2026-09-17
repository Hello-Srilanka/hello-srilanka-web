/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile project TypeScript in-memory; no runtime package needed for these tests.
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults, dayCount, dayDate, validatePreferences, readPreferences, groupBudget } = require('../lib/planner/model.ts');
const { sampleDraft } = require('../lib/planner/sample.ts');
const { finalize } = require('../lib/planner/validation.ts');
const p = { ...defaults, undecided: true, interests: ['Nature', 'Food'] };
const source = { id: 's1', title: 'Provider', url: 'https://example.com/travel', retrievedAt: new Date().toISOString() };
const finish = (draft, prefs = p, sources = [], mode = 'sample') => finalize(draft, prefs, sources, 'test-id', mode);
test('validates dates, children, bounds and per-person budget', () => {
  assert.deepEqual(validatePreferences(p), {});
  assert.equal(dayCount({ ...p, undecided: false, arrivalDate: '2027-01-01', departureDate: '2027-01-07' }), 7);
  assert.equal(dayDate(p, 0), null);
  assert.equal(groupBudget({ ...p, budget: '100', budgetBasis: 'person', children: 1 }), 300);
  assert.ok(validatePreferences({ ...p, children: 1 }).ages);
  assert.ok(validatePreferences({ ...p, children: 1, ages: ['18'] }).ages);
  assert.ok(validatePreferences({ ...p, duration: 22 }).duration);
  assert.ok(validatePreferences({ ...p, undecided: false, arrivalDate: '2027-02-30', departureDate: '2027-03-05' }).arrivalDate);
  assert.ok(validatePreferences({ ...p, budget: 'Infinity' }).budget);
  assert.throws(() => readPreferences({ ...p, adults: '2' }));
});
test('sample supports every duration with continuous overnights and no fabricated prices', () => {
  for (let duration = 1; duration <= 21; duration++) {
    const prefs = { ...p, duration }, trip = finish(sampleDraft(prefs), prefs);
    assert.equal(trip.days.length, duration);
    assert.equal(trip.knownCost, null);
    assert.equal(trip.days.at(-1).overnight, null);
    assert.equal(trip.days.at(-1).endLocation, p.departure);
  }
});
test('rejects broken overnight chain, count and duplicate activities', () => {
  let d = sampleDraft(p); d.days.pop(); assert.throws(() => finish(d), /trip length/);
  d = sampleDraft(p); d.days[1].startLocation = 'Wrong place'; assert.throws(() => finish(d), /connect/);
  const prefs = { ...p, duration: 3 }; d = sampleDraft(prefs);
  const activities = d.days.flatMap(day => day.items.filter(i => i.kind === 'activity'));
  activities[1].title = activities[0].title;
  assert.throws(() => finish(d, prefs), /repeats/);
});
test('rejects ungrounded journey estimates, invalid sources and overloaded timing', () => {
  let d = sampleDraft(p); d.days[0].items[0].durationMinutes = 120;
  assert.throws(() => finish(d), /source/);
  d = sampleDraft(p); d.days[0].items[0].sourceIds = ['made-up']; assert.throws(() => finish(d), /unverified/);
  d = sampleDraft(p); d.days[0].items[1].durationMinutes = 700; assert.throws(() => finish(d), /too full/);
  assert.throws(() => finish(sampleDraft(p), p, [{ ...source, url: 'javascript:alert(1)' }]), /invalid sources/);
});
test('validates partial group-cost arithmetic and rejects costs over budget', () => {
  const prefs = { ...p, duration: 1, budget: '30' }, d = sampleDraft(prefs);
  d.days[0].items[0].sourceIds = ['s1'];
  d.days[0].items.push({ ...d.days[0].items[0], title: 'A second activity' });
  d.days[0].items[0].cost = { amount: 10.1, basis: 'Whole group for this activity', sourceIds: ['s1'] };
  d.days[0].items[1].cost = { amount: 20.2, basis: 'Whole group for this leg', sourceIds: ['s1'] };
  assert.throws(() => finish(d, prefs, [source], 'live'), /exceed/);
  const trip = finish(d, { ...prefs, budget: '40' }, [source], 'live');
  assert.equal(trip.knownCost, 30.3);
  assert.ok(trip.unknownCosts.includes('Meals and incidentals'));
});
test('conflicts and malformed model responses fail safely', () => {
  const d = sampleDraft(p); d.conflicts = ['Requested destinations cannot fit in one day.'];
  assert.throws(() => finish(d), /cannot fit/);
  assert.throws(() => finish({ title: 'Truncated' }), /Incomplete/);
  const prefs = { ...p, arrivalTime: '23:30' };
  assert.throws(() => finish(sampleDraft(prefs), prefs), /flight times/);
});
test('flexible time windows respect departure and arrival, including an early departure', () => {
  const prefs = { ...p, duration: 1, departureTime: '14:00' }, d = sampleDraft(prefs);
  d.days[0].items[0].sourceIds = ['s1'];
  d.days[0].items[0].period = 'Evening';
  assert.throws(() => finish(d, prefs, [source], 'live'), /outside/);
  d.days[0].items[0].period = 'Morning';
  assert.equal(finish(d, { ...prefs, departureTime: '06:00' }, [source], 'live').days.length, 1);
});
test('provider uses web search, retains source timestamps and requests strict structured output', async () => {
  const { research, compose } = require('../lib/planner/provider.ts');
  const original = global.fetch; const calls = [];
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    return Response.json(calls.length === 1 ? {
      status: 'completed', output: [
        { type: 'web_search_call', status: 'completed', action: { sources: [{ url: source.url, title: source.title }] } },
        { type: 'message', content: [{ type: 'output_text', text: 'Research evidence', annotations: [{ type: 'url_citation', url: source.url, title: source.title }] }] },
      ],
    } : { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(sampleDraft(p)) }] }] });
  };
  try {
    const evidence = await research(p, AbortSignal.timeout(1000));
    assert.equal(calls[0].tools[0].type, 'web_search');
    assert.equal(calls[0].tool_choice, 'required');
    assert.equal(calls[0].store, false);
    assert.equal(evidence.sources.length, 1);
    assert.ok(Date.parse(evidence.sources[0].retrievedAt));
    await compose(p, evidence, AbortSignal.timeout(1000));
    assert.equal(calls[1].text.format.strict, true);
    assert.equal(calls[1].text.format.type, 'json_schema');
    assert.match(calls[1].instructions, /untrusted data/);
  } finally { global.fetch = original; }
});
test('provider rejects failed searches, refusals, incomplete JSON and provider errors', async () => {
  const { research, compose } = require('../lib/planner/provider.ts');
  const original = global.fetch;
  try {
    global.fetch = async () => Response.json({ status: 'completed', output: [] });
    await assert.rejects(() => research(p, AbortSignal.timeout(1000)), /Web search/);
    global.fetch = async () => Response.json({ status: 'incomplete', output: [] });
    await assert.rejects(() => research(p, AbortSignal.timeout(1000)), /incomplete/);
    global.fetch = async () => Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] });
    await assert.rejects(() => compose(p, { text: '', sources: [] }, AbortSignal.timeout(1000)), /incomplete/);
    global.fetch = async () => Response.json({}, { status: 429 });
    await assert.rejects(() => research(p, AbortSignal.timeout(1000)), /busy/);
    global.fetch = async () => { throw new DOMException('Timed out', 'TimeoutError'); };
    await assert.rejects(() => research(p, AbortSignal.timeout(1000)), /Timed out/);
  } finally { global.fetch = original; }
});
test('discovery validates only the current chapter and migrates previous drafts', () => {
  const { discoveryErrors, restoreDiscoveryStep, journeyStory } = require('../lib/planner/discovery.ts');
  const unfinished = { ...defaults, interests: ['Nature'], budget: '-50' };
  assert.deepEqual(discoveryErrors(unfinished, 0), {}, 'Dates and budget do not block choosing moments');
  assert.deepEqual(discoveryErrors(unfinished, 1), {}, 'Future budget errors do not block rhythm');
  assert.ok(discoveryErrors(unfinished, 2).arrivalDate);
  assert.ok(discoveryErrors(unfinished, 3).budget);
  assert.deepEqual(discoveryErrors(unfinished, 4), {});
  assert.ok(discoveryErrors(unfinished, 5).budget);
  assert.equal(restoreDiscoveryStep(1, undefined), 2, 'Old basics becomes the time chapter');
  assert.equal(restoreDiscoveryStep(4, undefined), 5, 'Old review remains review');
  assert.equal(restoreDiscoveryStep(3, 2), 3, 'Current drafts keep their chapter');
  assert.equal(journeyStory(unfinished).duration, null, 'Undecided/invalid dates never become a made-up duration');
});
