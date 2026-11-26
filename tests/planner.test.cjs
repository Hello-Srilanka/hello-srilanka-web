/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile project TypeScript in-memory; no runtime package needed for these tests.
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults, dayCount, dayDate, validatePreferences, readPreferences, groupBudget, itineraryRequestPreferences } = require('../lib/planner/model.ts');
const { sampleDraft } = require('../lib/planner/sample.ts');
const { finalize } = require('../lib/planner/validation.ts');
const { itineraryRoute } = require('../lib/planner/trip-route.ts');
const p = { ...defaults, undecided: true, interests: ['Nature', 'Food'] };
const source = { id: 's1', title: 'Provider', url: 'https://example.com/travel', retrievedAt: new Date().toISOString() };
const finish = (draft, prefs = p, sources = [], mode = 'sample') => finalize(draft, prefs, sources, 'test-id', mode);
test('trip route groups consecutive nights and preserves return visits and unmapped stops', () => {
  const { days } = sampleDraft(p);
  const bases = ['Kandy [s1]', 'Kandy, Sri Lanka', 'Sinharagama', 'Kandy', 'Ella', 'Ella'];
  days.forEach((day, index) => { day.overnight = bases[index] ?? null; });
  days.at(-1).endLocation = 'CMB';
  const route = itineraryRoute({ days });
  assert.deepEqual(route.map(({ name, detail }) => [name, detail]), [
    [p.arrival, 'Arrival'], ['Kandy', '2 nights'], ['Sinharagama', '1 night'], ['Kandy', '1 night'], ['Ella', '2 nights'], ['CMB', 'Departure'],
  ]);
  assert.equal(route[2].point, null);
  assert.deepEqual(route[1].point, route[3].point);
  assert.deepEqual(route[0].point, route.at(-1).point);
  assert.ok(route[4].point.x > route[1].point.x);
});
test('trip route includes a same-day destination without inventing an overnight', () => {
  const { days } = sampleDraft({ ...p, duration: 1 });
  days[0].destination = 'Negombo';
  const route = itineraryRoute({ days });
  assert.deepEqual(route.map(stop => stop.detail), ['Arrival', 'Day visit', 'Departure']);
  assert.ok(route[1].point);
});
test('trip route plots a saved hotel stay at its city while retaining the hotel name', () => {
  const { days } = sampleDraft({ ...p, duration: 4 });
  for (const day of days.slice(0, -1)) {
    day.destination = 'Colombo';
    day.overnight = 'The Kingsbury Colombo';
    day.stay.name = 'The Kingsbury Colombo [s1]';
  }
  days[1].destination = 'Kandy';
  const route = itineraryRoute({ days });
  assert.equal(route[1].name, 'The Kingsbury Colombo');
  assert.equal(route[1].detail, '3 nights');
  assert.equal(route[1].mapArea, 'Colombo');
  assert.deepEqual(route[1].point, itineraryRoute({ days: [{ ...days[0], overnight: 'Colombo' }] })[1].point);

  for (const day of days.slice(0, -1)) {
    day.overnight = 'Unmapped Guest House';
    day.stay.name = 'Unmapped Guest House';
  }
  assert.equal(itineraryRoute({ days })[1].point, null, 'conflicting destinations do not place a hotel without a city in its name');
  days[1].destination = 'Colombo';
  assert.equal(itineraryRoute({ days })[1].mapArea, 'Colombo', 'consistent overnight destinations can supply the area');
});
test('validates dates, children, bounds and total group budget', () => {
  assert.deepEqual(validatePreferences(p), {});
  assert.equal(dayCount({ ...p, undecided: false, arrivalDate: '2027-01-01', departureDate: '2027-01-07' }), 7);
  assert.equal(dayDate(p, 0), null);
  assert.equal(groupBudget({ ...p, budget: '300', children: 1 }), 300);
  assert.ok(validatePreferences({ ...p, children: 1 }).ages);
  assert.ok(validatePreferences({ ...p, children: 1, ages: ['18'] }).ages);
  assert.ok(validatePreferences({ ...p, duration: 22 }).duration);
  assert.ok(validatePreferences({ ...p, undecided: false, arrivalDate: '2027-02-30', departureDate: '2027-03-05' }).arrivalDate);
  assert.ok(validatePreferences({ ...p, budget: 'Infinity' }).budget);
  assert.throws(() => readPreferences({ ...p, adults: '2' }));
});
test('restores old per-person budgets as the same total group target', () => {
  const restored = readPreferences({ ...p, budget: '100.25', budgetBasis: 'person', adults: 2, children: 1, ages: ['8'] });
  assert.equal(restored.budget, '300.75');
  assert.equal(groupBudget(restored), 300.75);
  assert.equal(Object.hasOwn(restored, 'budgetBasis'), false);
});
test('normalizes fixed and flexible date inputs before generation', () => {
  const fixed = readPreferences({ ...p, undecided: false, arrivalDate: '2026-12-31', departureDate: '2027-01-15', duration: 7, month: 'March' });
  assert.equal(dayCount(fixed), 16);
  assert.equal(fixed.duration, 16);
  assert.equal(fixed.month, 'Any month');
  const fixedRequest = itineraryRequestPreferences(fixed);
  assert.deepEqual(fixedRequest.datePlan, { mode: 'fixed', arrivalDate: '2026-12-31', departureDate: '2027-01-15', dayCount: 16 });
  assert.equal(Object.hasOwn(fixedRequest, 'duration'), false);
  assert.equal(Object.hasOwn(fixedRequest, 'month'), false);
  const flexible = readPreferences({ ...p, undecided: true, arrivalDate: '2026-12-31', departureDate: '2027-01-15', duration: 7 });
  assert.equal(flexible.arrivalDate, '');
  assert.equal(flexible.departureDate, '');
});
test('saved nationality and previous opt-ins do not influence generated itineraries', () => {
  const plan = { ...p, interests: ['Nature'] };
  const saved = readPreferences({ ...plan, nationality: 'United Kingdom', useNationalitySuggestions: true });
  assert.equal(saved.nationality, 'United Kingdom');
  assert.equal(saved.useNationalitySuggestions, true, 'Existing requests keep their original hash');
  assert.deepEqual(itineraryRequestPreferences(saved), itineraryRequestPreferences(plan));
  const request = itineraryRequestPreferences(saved);
  for (const field of ['nationality', 'otherNationality', 'useNationalitySuggestions', 'nationalitySuggestions']) {
    assert.equal(Object.hasOwn(request, field), false);
  }
  assert.deepEqual(sampleDraft(saved), sampleDraft(plan));
  assert.deepEqual(validatePreferences({ ...saved, nationality: 'Other', otherNationality: 'Canada' }), {});
  assert.ok(validatePreferences({ ...p, nationality: 'Other' }).otherNationality);
  const previousDraft = { ...p }; delete previousDraft.nationality; delete previousDraft.otherNationality; delete previousDraft.useNationalitySuggestions;
  const restored = readPreferences(previousDraft);
  assert.equal(restored.useNationalitySuggestions, false);
  assert.equal(restored.nationality, '');
});
test('nationality choices include searchable countries and ship SVG flags', () => {
  const { otherCountries } = require('../lib/planner/countries.ts');
  const { supportedNationalities } = require('../lib/planner/nationality.ts');
  const flagStyles = fs.readFileSync(require.resolve('flag-icons/css/flag-icons.min.css'), 'utf8');
  for (const { code } of [...supportedNationalities, ...otherCountries]) {
    const isoCode = code.toLowerCase();
    assert.ok(flagStyles.includes(`.fi-${isoCode}{`), `Missing flag style for ${code}`);
    assert.ok(require.resolve(`flag-icons/flags/4x3/${isoCode}.svg`));
  }
  assert.ok(otherCountries.some(country => country.name === 'Sri Lanka' && country.code === 'LK'));
  assert.ok(otherCountries.some(country => country.name === 'Canada'));
  assert.equal(otherCountries.some(country => country.code === 'IN'), false);
  assert.equal(otherCountries.length > 200, true);
});
test('ignores the retired international-flights budget choice in saved preferences', () => {
  const restored = readPreferences({ ...p, flightsIncluded: true });
  assert.equal(Object.hasOwn(restored, 'flightsIncluded'), false);
  assert.equal(Object.hasOwn(itineraryRequestPreferences(restored), 'flightsIncluded'), false);
  assert.equal(finish(sampleDraft(restored), restored).unknownCosts.includes('International flights'), false);
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
test('sample revisions can revise one day or the whole trip without overwriting the original', () => {
  const { readRevisionOptions, revisionPreferences, reviseSample } = require('../lib/planner/revision.ts');
  const original = finish(sampleDraft(p));
  const options = readRevisionOptions({ dayNumber: 2, goal: 'interests', interest: 'Wildlife', note: '', budget: '' });
  const revised = reviseSample({ original, options, ownerId: null }, revisionPreferences(original, options), 'day-revision');
  assert.deepEqual(revised.revision, { originalId: original.id, dayNumber: 2 });
  assert.deepEqual(revised.days.filter(day => day.number !== 2), original.days.filter(day => day.number !== 2));
  assert.deepEqual(revised.days[1].stay, original.days[1].stay);
  assert.match(revised.days[1].items.find(item => item.kind === 'activity').title, /wildlife/);
  assert.deepEqual(revised.preferences, original.preferences);

  const whole = { ...options, dayNumber: null, goal: 'relaxed', interest: '' };
  const trip = reviseSample({ original, options: whole, ownerId: null }, revisionPreferences(original, whole), 'trip-revision');
  assert.equal(trip.preferences.pace, 'Relaxed');
  assert.equal(original.preferences.pace, 'Balanced');
  assert.equal(trip.days.length, original.days.length);
  assert.equal(trip.revision.dayNumber, null);
  assert.throws(() => readRevisionOptions({ ...options, budget: '200' }), /whole trip/);
  assert.throws(() => revisionPreferences(original, { ...options, dayNumber: 21 }), /day in this itinerary/);
});
test('one-day revisions reject changes to the overnight stay and invalid routes', () => {
  const { finalizeRevision } = require('../lib/planner/revision.ts');
  const original = finish(sampleDraft(p));
  const plan = { original, options: { dayNumber: 2, goal: 'custom', interest: '', note: 'Change the activity', budget: '' }, ownerId: null };
  const changedHotel = structuredClone(original.days[1]);
  changedHotel.stay.name = 'Different hotel';
  assert.throws(() => finalizeRevision(plan, { day: changedHotel, summary: original.summary }, p, [], 'new-id'), /same start, end and overnight stay/);
  const broken = structuredClone(original.days[1]);
  broken.items[0].from = 'Wrong starting point';
  assert.throws(() => finalizeRevision(plan, { day: broken, summary: original.summary }, p, [], 'new-id'), /disconnected/);
});
test('live revisions keep source IDs distinct and apply the requested scope and budget', async () => {
  const { revisionPreferences } = require('../lib/planner/revision.ts');
  const { reviseLiveItinerary } = require('../lib/planner/generate.ts');
  const draft = sampleDraft(p);
  for (const day of draft.days) {
    if (day.stay) day.stay.sourceId = source.id;
    for (const item of day.items) if (item.kind === 'activity') item.sourceIds = [source.id];
  }
  const original = finish(draft, p, [source], 'live');
  const calls = [];
  const originalFetch = global.fetch;
  try {
    global.fetch = async (_, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.tools) return Response.json({ status: 'completed', output: [
        { type: 'web_search_call', status: 'completed', action: { sources: [{ url: 'https://example.com/new-activity', title: 'New activity' }] } },
        { type: 'message', content: [{ type: 'output_text', text: 'A supported new activity', annotations: [{ type: 'url_citation', url: 'https://example.com/new-activity' }] }] },
      ] });
      const next = structuredClone(draft);
      const item = next.days[1].items.find(value => value.kind === 'activity');
      item.title = 'Revised walking activity';
      item.sourceIds = ['s2'];
      next.summary = 'A revised trip with a walk on day two.';
      const output = JSON.parse(body.input).repair?.dayNumber ? { day: next.days[1], summary: next.summary } : next;
      return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(output) }] }] });
    };
    const options = { dayNumber: 2, goal: 'custom', interest: '', note: 'Include a walk', budget: '' };
    const plan = { original, options, ownerId: null };
    const telemetry = { requestId: 'test-revision', record: () => {} };
    const oneDay = await reviseLiveItinerary(plan, revisionPreferences(original, options), 'revised-day', AbortSignal.timeout(1000), telemetry, async () => {});
    assert.deepEqual(oneDay.sources.map(item => item.id), ['s1', 's2']);
    assert.deepEqual(oneDay.days[0], original.days[0]);
    assert.match(oneDay.summary, /walk on day two/);
    assert.equal(JSON.parse(calls[1].input).repair.dayNumber, 2);
    const wholeTrip = { ...plan, options: { ...options, dayNumber: null, budget: '500' } };
    const whole = await reviseLiveItinerary(wholeTrip, revisionPreferences(original, wholeTrip.options), 'revised-all', AbortSignal.timeout(1000), telemetry, async () => {});
    assert.equal(whole.preferences.budget, '500');
    assert.equal(whole.revision.dayNumber, null);
    assert.equal(JSON.parse(calls[3].input).revision.currentPlan.length, original.days.length);
  } finally { global.fetch = originalFetch; }
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
  const original = global.fetch, originalInfo = console.info; const calls = [], recorded = [], logs = [];
  console.info = line => logs.push(line);
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    return Response.json(calls.length === 1 ? {
      status: 'completed', output: [
        { type: 'web_search_call', status: 'completed', action: { sources: [{ url: source.url, title: source.title }] } },
        { type: 'message', content: [{ type: 'output_text', text: 'Research evidence', annotations: [{ type: 'url_citation', url: source.url, title: source.title, start_index: 0, end_index: 17 }] }] },
      ], usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 100, cache_write_tokens: 200 }, output_tokens: 500, total_tokens: 1500 },
    } : { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(sampleDraft(p)) }] }], usage: { input_tokens: 2000, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 }, output_tokens: 1000, total_tokens: 3000 } });
  };
  try {
    const evidence = await research(p, AbortSignal.timeout(1000), { requestId: 'safe-test-id', record: value => recorded.push(value) });
    assert.equal(calls[0].tools[0].type, 'web_search');
    assert.equal(calls[0].tool_choice, 'required');
    assert.equal(calls[0].store, false);
    assert.equal(calls[0].model, 'gpt-6-sol');
    assert.equal(calls[0].reasoning.effort, 'low');
    assert.match(calls[0].input, /"datePlan":\{"mode":"flexible","durationDays":7/);
    assert.doesNotMatch(calls[0].input, /"arrivalDate"|"departureDate"/);
    assert.match(calls[0].input, /budget covers Sri Lanka trip costs only/);
    assert.equal(evidence.sources.length, 1);
    assert.match(evidence.text, /\[s1\]/);
    assert.ok(Date.parse(evidence.sources[0].retrievedAt));
    assert.equal(recorded[0].webSearchCalls, 1);
    assert.ok(Math.abs(recorded[0].estimatedCostUsd - 0.01692) < 1e-9);
    assert.match(logs[0], /^\[AI usage\] request_id=safe-test-id stage=research model=gpt-6-sol .*estimated_cost_usd=0\.016920 .*time_seconds=/);
    await compose(p, evidence, AbortSignal.timeout(1000));
    assert.equal(calls[1].text.format.strict, true);
    assert.equal(calls[1].text.format.type, 'json_schema');
    assert.equal(calls[1].model, 'gpt-6-sol');
    assert.equal(calls[1].reasoning.effort, 'medium');
    assert.equal(JSON.parse(calls[1].input).preferences.datePlan.durationDays, 7);
    assert.equal(Object.hasOwn(JSON.parse(calls[1].input).preferences, 'duration'), false);
    assert.match(calls[1].instructions, /untrusted data/);
    assert.match(calls[1].instructions, /budget excludes international flights/);
    await compose(p, evidence, AbortSignal.timeout(1000), { draft: sampleDraft(p), validationError: 'Day 2 does not connect.' });
    assert.equal(JSON.parse(calls[2].input).repair.validationError, 'Day 2 does not connect.');
    assert.match(calls[2].instructions, /Correct the previous draft/);
  } finally { global.fetch = original; console.info = originalInfo; }
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
test('reviewed knowledge bypasses live search only when coverage is complete', async () => {
  const { research } = require('../lib/planner/provider.ts');
  const original = global.fetch;
  global.fetch = async () => { throw new Error('An unnecessary web request was made.'); };
  try {
    const knowledge = { complete: true, text: 'A sourced attraction claim [k1]', sources: [{ ...source, id: 'k1' }] };
    const evidence = await research(p, AbortSignal.timeout(1000), undefined, knowledge);
    assert.equal(evidence.sources[0].id, 'k1');
    assert.match(evidence.text, /single-base route/);
  } finally { global.fetch = original; }
});
test('discovery validates only the current chapter and migrates previous drafts', () => {
  const { datesStep, discoveryErrors, flowVersion, personaliseStep, restoreDiscoveryStep, reviewStep, travellersStep, journeyStory } = require('../lib/planner/discovery.ts');
  const unfinished = { ...defaults, interests: ['Nature'], budget: '-50' };
  assert.deepEqual(discoveryErrors(unfinished, 0), {}, 'Dates and budget do not block nationality');
  assert.deepEqual(discoveryErrors(unfinished, 1), {}, 'Future budget errors do not block interests');
  assert.deepEqual(discoveryErrors(unfinished, 2), {}, 'Future budget errors do not block pace');
  const incompleteGroup = { ...unfinished, children: 2, ages: ['6', ''], accessibility: 'x'.repeat(601) };
  assert.ok(discoveryErrors(incompleteGroup, datesStep).arrivalDate);
  assert.deepEqual(discoveryErrors({ ...incompleteGroup, undecided: true }, datesStep), {}, 'The dates step accepts incomplete traveller details');
  assert.deepEqual(Object.keys(discoveryErrors(incompleteGroup, travellersStep)).sort(), ['accessibility', 'ages']);
  assert.deepEqual(discoveryErrors({ ...unfinished, children: 2, ages: ['6', '9'] }, travellersStep), {}, 'The travellers step ignores dates and optional budget errors');
  assert.deepEqual(discoveryErrors(defaults, personaliseStep), {}, 'All personalisation fields are optional');
  assert.deepEqual(Object.keys(discoveryErrors(incompleteGroup, personaliseStep)), ['budget'], 'Personalisation ignores unfinished dates and travellers');
  assert.ok(discoveryErrors(unfinished, reviewStep).budget);
  assert.ok(discoveryErrors({ ...unfinished, nationality: 'Other' }, 0).otherNationality);
  assert.equal(restoreDiscoveryStep(1, undefined), datesStep, 'Old basics becomes the dates chapter');
  assert.equal(restoreDiscoveryStep(4, undefined), reviewStep, 'Old review remains review');
  assert.equal(restoreDiscoveryStep(3, 2), reviewStep, 'Previous budget chapter moves to review');
  assert.equal(restoreDiscoveryStep(4, 2), reviewStep, 'Previous comforts chapter moves to review');
  assert.equal(restoreDiscoveryStep(2, 3), datesStep, 'The previous trip chapter opens at dates');
  assert.equal(restoreDiscoveryStep(3, 4), datesStep, 'The combined dates and travellers chapter opens at dates');
  assert.equal(restoreDiscoveryStep(4, 4), reviewStep, 'Version 4 review resumes at review');
  assert.equal(restoreDiscoveryStep(4, 5), travellersStep, 'Version 5 travellers resumes on the same step');
  assert.equal(restoreDiscoveryStep(5, 5), reviewStep, 'Version 5 review resumes at review');
  assert.equal(restoreDiscoveryStep(travellersStep, flowVersion), travellersStep, 'New drafts resume on the separate travellers step');
  assert.equal(restoreDiscoveryStep(personaliseStep, flowVersion), personaliseStep, 'New drafts resume on personalisation');
  assert.equal(journeyStory(unfinished).duration, null, 'Undecided/invalid dates never become a made-up duration');
});
test('planner session drafts expire and never contain completed itineraries', () => {
  const { datesStep, reviewStep } = require('../lib/planner/discovery.ts');
  const { plannerSessionTtl, serializePlannerSession, parsePlannerSession, isPristinePlannerSession } = require('../lib/planner/session.ts');
  const now = 1_800_000_000_000;
  const state = { preferences: p, step: 3, furthest: 3, editing: false, screen: 'form', requestId: null };
  const raw = serializePlannerSession(state, now);
  assert.equal(parsePlannerSession(raw, now + plannerSessionTtl - 1).step, 3);
  const legacy = JSON.parse(raw);
  legacy.flowVersion = 2;
  legacy.step = 4;
  legacy.preferences = { ...p, budget: '100', budgetBasis: 'person' };
  const migrated = parsePlannerSession(JSON.stringify(legacy), now);
  assert.equal(migrated.step, reviewStep);
  assert.equal(migrated.preferences.budget, '200');
  const v4 = { ...JSON.parse(raw), flowVersion: 4, step: 3, furthest: 4, editing: true, preferences: { ...p, children: 2, ages: ['6', '9'], accessibility: 'Step-free access' } };
  const restored = parsePlannerSession(JSON.stringify(v4), now);
  assert.equal(restored.step, datesStep);
  assert.equal(restored.furthest, reviewStep);
  assert.equal(restored.editing, true);
  assert.deepEqual(restored.preferences.ages, ['6', '9']);
  assert.equal(restored.preferences.accessibility, 'Step-free access');
  const v5 = { ...v4, flowVersion: 5, step: 4, furthest: 5, preferences: { ...v4.preferences, budget: '2500', currency: 'EUR', transport: 'Private driver', accommodation: 'Guesthouses', mustVisit: 'Ella' } };
  const restoredV5 = parsePlannerSession(JSON.stringify(v5), now);
  assert.equal(restoredV5.furthest, reviewStep);
  assert.equal(restoredV5.editing, true);
  assert.deepEqual(restoredV5.preferences, v5.preferences);
  assert.equal(parsePlannerSession(raw, now + plannerSessionTtl), null);
  assert.equal(Object.hasOwn(JSON.parse(raw), 'itinerary'), false);
  assert.equal(isPristinePlannerSession({ preferences: defaults, step: 0, furthest: 0, editing: false, screen: 'form', requestId: null }), true);
});
