/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults, readPreferences, validatePreferences } = require('../lib/planner/model.ts');
const { sampleDraft } = require('../lib/planner/sample.ts');
const { DayValidationError, finalize, mergeDayRepair } = require('../lib/planner/validation.ts');
const { researchTargets, repairDay, research } = require('../lib/planner/provider.ts');
const { generateLiveItinerary } = require('../lib/planner/generate.ts');
const prefs = { ...defaults, undecided: true, interests: ['Nature'], duration: 7 };

test('evaluation fixtures are unique and valid planner inputs', () => {
  const fixtures = JSON.parse(fs.readFileSync(`${__dirname}/fixtures/planner-eval.json`, 'utf8'));
  assert.equal(new Set(fixtures.map(item => item.id)).size, fixtures.length);
  assert.ok(fixtures.length >= 8);
  for (const fixture of fixtures) assert.deepEqual(validatePreferences(readPreferences({ ...defaults, ...fixture.preferences })), {}, fixture.id);
});

test('evidence budget grows with activity slots and route connections on long trips', () => {
  const short = researchTargets({ ...prefs, duration: 3 });
  const long = researchTargets({ ...prefs, duration: 21 });
  assert.ok(long.activityFacts > short.activityFacts);
  assert.ok(long.connectingLegs > short.connectingLegs);
  assert.ok(long.maxEvidenceBullets > 32);
  assert.equal(long.maxEvidenceBullets, long.activityFacts + long.overnightStops + long.connectingLegs + 4);
  assert.ok(researchTargets({ ...prefs, duration: 21, pace: 'Relaxed' }).activityFacts < long.activityFacts);
});

test('benchmark baseline retains the former 32-bullet research ceiling', async () => {
  const originalFetch = global.fetch;
  let body;
  global.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return Response.json({ status: 'completed', output: [
      { type: 'web_search_call', status: 'completed', action: { sources: [{ url: 'https://example.com/travel', title: 'Travel' }] } },
      { type: 'message', content: [{ type: 'output_text', text: 'Verified route fact', annotations: [{ type: 'url_citation', url: 'https://example.com/travel', end_index: 19 }] }] },
    ] });
  };
  try {
    await research({ ...prefs, duration: 21 }, AbortSignal.timeout(1000), undefined, undefined, 'baseline');
    assert.match(body.input, /at most 32 short factual bullets/);
    assert.equal(body.max_output_tokens, 6500);
    await research({ ...prefs, duration: 21 }, AbortSignal.timeout(1000), undefined, undefined, 'optimized');
    assert.match(body.input, /Never exceed 59 factual bullets/);
    assert.ok(body.max_output_tokens > 6500);
  } finally { global.fetch = originalFetch; }
});

test('day repair replaces only the failed day and the complete trip is revalidated', () => {
  const original = sampleDraft(prefs);
  const invalid = structuredClone(original);
  invalid.days[1].startLocation = 'Wrong location';
  assert.throws(() => finalize(invalid, prefs, [], 'test', 'sample'), error => error instanceof DayValidationError && error.dayNumber === 2);
  const merged = mergeDayRepair(invalid, original.days[1], 2);
  assert.strictEqual(merged.days[0], invalid.days[0]);
  assert.strictEqual(merged.days[2], invalid.days[2]);
  assert.equal(finalize(merged, prefs, [], 'test', 'sample').days.length, 7);
  assert.throws(() => mergeDayRepair(invalid, original.days[1], 3), /did not match/);
  assert.throws(() => mergeDayRepair(invalid, { number: 2 }, 2), /Incomplete/);
  const stillInvalid = mergeDayRepair(invalid, invalid.days[1], 2);
  assert.throws(() => finalize(stillInvalid, prefs, [], 'test', 'sample'), DayValidationError);
});

test('focused API repair requests one day instead of resending the full draft', async () => {
  const originalFetch = global.fetch;
  const draft = sampleDraft(prefs);
  const evidence = { text: 'Reviewed activity [k1]', sources: [{ id: 'k1', title: 'Activity', url: 'https://example.com/activity', retrievedAt: null }] };
  let body;
  global.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ day: draft.days[1] }) }] }] });
  };
  try {
    const patch = await repairDay(prefs, evidence, draft, 2, 'Day 2 does not connect.', AbortSignal.timeout(1000));
    assert.equal(patch.day.number, 2);
    assert.deepEqual(Object.keys(body.text.format.schema.properties), ['day']);
    const input = JSON.parse(body.input);
    assert.equal(input.repair.dayNumber, 2);
    assert.equal(input.repair.day.number, 2);
    assert.equal(input.repair.previousDay.number, 1);
    assert.equal(input.repair.nextDay.number, 3);
    assert.equal(Object.hasOwn(input.repair, 'draft'), false);
    assert.equal(body.max_output_tokens, 6500);
  } finally { global.fetch = originalFetch; }
});

test('production generation merges a focused repair and validates every day', async () => {
  const originalFetch = global.fetch;
  const valid = structuredClone(sampleDraft(prefs));
  for (const day of valid.days) {
    for (const item of day.items) if (item.kind === 'activity') item.sourceIds = ['k1'];
    if (day.stay) day.stay.sourceId = 'k1';
  }
  const invalid = structuredClone(valid);
  invalid.days[1].startLocation = 'Wrong location';
  const requests = [];
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    const result = requests.length === 1 ? invalid : { day: valid.days[1] };
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(result) }] }] });
  };
  try {
    const knowledge = { complete: true, text: 'Reviewed claim [k1]', sources: [{ id: 'k1', title: 'Provider', url: 'https://example.com/travel', retrievedAt: null }] };
    const generated = await generateLiveItinerary(prefs, 'test-id', AbortSignal.timeout(1000), undefined, undefined, knowledge);
    assert.deepEqual(generated.repairStages, ['day']);
    assert.equal(generated.itinerary.days.length, prefs.duration);
    assert.equal(generated.itinerary.days[1].startLocation, valid.days[1].startLocation);
    assert.equal(requests.length, 2);
    assert.deepEqual(Object.keys(requests[1].text.format.schema.properties), ['day']);
  } finally { global.fetch = originalFetch; }
});

test('benchmark baseline uses full-draft repair for the same local failure', async () => {
  const originalFetch = global.fetch;
  const valid = structuredClone(sampleDraft(prefs));
  for (const day of valid.days) {
    for (const item of day.items) if (item.kind === 'activity') item.sourceIds = ['k1'];
    if (day.stay) day.stay.sourceId = 'k1';
  }
  const invalid = structuredClone(valid);
  invalid.days[1].startLocation = 'Wrong location';
  const requests = [];
  global.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(requests.length === 1 ? invalid : valid) }] }] });
  };
  try {
    const knowledge = { complete: true, text: 'Reviewed claim [k1]', sources: [{ id: 'k1', title: 'Provider', url: 'https://example.com/travel', retrievedAt: null }] };
    const generated = await generateLiveItinerary(prefs, 'test-id', AbortSignal.timeout(1000), undefined, undefined, knowledge, 'baseline');
    assert.deepEqual(generated.repairStages, ['full']);
    assert.equal(generated.itinerary.days.length, prefs.duration);
    assert.equal(requests.length, 2);
    assert.ok(Object.hasOwn(requests[1].text.format.schema.properties, 'days'));
  } finally { global.fetch = originalFetch; }
});
