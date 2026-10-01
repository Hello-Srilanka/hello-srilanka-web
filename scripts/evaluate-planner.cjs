/* eslint-disable @typescript-eslint/no-require-imports -- Node script loads project TypeScript without a runtime dependency. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { defaults, readPreferences, validatePreferences } = require('../lib/planner/model.ts');
const { loadKnowledge } = require('../lib/knowledge/retrieval.ts');
const { generateLiveItinerary } = require('../lib/planner/generate.ts');

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, '../tests/fixtures/planner-eval.json'), 'utf8'));
const args = process.argv.slice(2);
const command = args[0];
const option = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const sum = (values, field) => values.reduce((total, value) => total + (value[field] || 0), 0);
const round = value => value === null ? null : Math.round(value * 10000) / 10000;

function reviewItems(itinerary) {
  const sources = new Map(itinerary.sources.map(source => [source.id, source.url]));
  const items = [];
  const add = (day, kind, claim, sourceIds) => items.push({ day, kind, claim, sourceIds, sourceUrls: sourceIds.map(id => sources.get(id)).filter(Boolean), supported: null });
  for (const day of itinerary.days) {
    for (const item of day.items) {
      add(day.number, item.kind, `${item.title}: ${item.description}${item.kind === 'transport' && item.durationMinutes !== null ? ` Suggested duration: ${item.durationMinutes} minutes.` : ''}`, item.sourceIds);
      if (item.cost.amount !== null) add(day.number, 'price', `${item.cost.amount} ${itinerary.preferences.currency}: ${item.cost.basis}`, item.cost.sourceIds);
    }
    if (day.stay) {
      add(day.number, 'stay', `${day.stay.name}: ${day.stay.description}`, day.stay.sourceId ? [day.stay.sourceId] : []);
      if (day.stay.cost.amount !== null) add(day.number, 'price', `${day.stay.cost.amount} ${itinerary.preferences.currency}: ${day.stay.cost.basis}`, day.stay.cost.sourceIds);
    }
  }
  return items;
}

function summarize(report) {
  const cases = report.cases;
  const successful = cases.filter(item => item.success);
  const allMetrics = cases.flatMap(item => item.metrics);
  const allReviews = cases.flatMap(item => item.reviewItems || []);
  const checked = allReviews.filter(item => typeof item.supported === 'boolean');
  const costKnown = allMetrics.every(item => item.estimatedCostUsd !== null);
  const totalCost = costKnown ? allMetrics.reduce((total, item) => total + item.estimatedCostUsd, 0) : null;
  return {
    cases: cases.length,
    validItineraries: successful.length,
    validRate: round(cases.length ? successful.length / cases.length : 0),
    repairCalls: sum(cases, 'repairCalls'),
    dayRepairCalls: allMetrics.filter(item => item.stage === 'day_repair').length,
    webSearchCalls: sum(allMetrics, 'webSearchCalls'),
    averageSeconds: round(cases.length ? sum(cases, 'durationMs') / cases.length / 1000 : 0),
    inputTokens: sum(allMetrics, 'inputTokens'),
    outputTokens: sum(allMetrics, 'outputTokens'),
    totalEstimatedCostUsd: round(totalCost),
    costPerSuccessfulItineraryUsd: round(totalCost !== null && successful.length ? totalCost / successful.length : null),
    citationCoverage: round(allReviews.length ? allReviews.filter(item => item.sourceIds.length > 0).length / allReviews.length : null),
    factualCitationAccuracy: round(checked.length ? checked.filter(item => item.supported).length / checked.length : null),
    manuallyCheckedClaims: checked.length,
  };
}

async function run() {
  if (!args.includes('--live')) throw new Error('Live evaluation uses paid API calls. Add --live explicitly.');
  const localEnv = path.join(__dirname, '../.env.local');
  if (fs.existsSync(localEnv)) process.loadEnvFile(localEnv);
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing. Load .env.local without printing it.');
  const label = option('--label');
  const out = option('--out');
  const variant = option('--variant') || 'optimized';
  if (!['baseline', 'optimized'].includes(variant)) throw new Error('--variant must be baseline or optimized.');
  if (!label || !out) throw new Error('Provide --label NAME and --out PATH.');
  const chosen = option('--case') ? fixtures.filter(item => item.id === option('--case')) : fixtures;
  if (!chosen.length) throw new Error('Unknown fixture ID.');
  const frozen = option('--knowledge-from') ? JSON.parse(fs.readFileSync(option('--knowledge-from'), 'utf8')) : null;
  if (frozen && chosen.some(item => !frozen.cases.some(previous => previous.id === item.id && previous.knowledge))) throw new Error('The knowledge snapshot is missing a selected case.');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const handle = fs.openSync(out, 'wx');
  fs.closeSync(handle);
  const report = { label, variant, createdAt: new Date().toISOString(), fixtureIds: chosen.map(item => item.id), cases: [] };
  for (const fixture of chosen) {
    const preferences = readPreferences({ ...defaults, ...fixture.preferences });
    const errors = validatePreferences(preferences);
    if (Object.keys(errors).length) throw new Error(`Invalid fixture ${fixture.id}: ${Object.keys(errors).join(', ')}`);
    const metrics = [];
    const started = Date.now();
    const entry = { id: fixture.id, success: false, durationMs: 0, metrics, repairCalls: 0, repairStages: [], reviewItems: [], knowledge: null };
    try {
      const knowledge = frozen ? frozen.cases.find(item => item.id === fixture.id).knowledge : await loadKnowledge(preferences);
      entry.knowledge = knowledge;
      const details = await generateLiveItinerary(preferences, crypto.randomUUID(), AbortSignal.timeout(200000), { requestId: crypto.randomUUID(), record: metric => metrics.push(metric) }, undefined, knowledge, variant);
      entry.success = true;
      entry.repairStages = details.repairStages;
      entry.reviewItems = reviewItems(details.itinerary);
      entry.itinerary = details.itinerary;
    } catch (error) {
      entry.error = error instanceof Error ? error.message : 'Unknown evaluation failure';
    }
    entry.durationMs = Date.now() - started;
    entry.repairCalls = metrics.filter(metric => metric.stage === 'repair' || metric.stage === 'day_repair').length;
    report.cases.push(entry);
    fs.writeFileSync(out, JSON.stringify({ ...report, summary: summarize(report) }, null, 2));
    process.stdout.write(`${fixture.id}: ${entry.success ? 'valid' : 'failed'}; ${metrics.reduce((total, metric) => total + metric.webSearchCalls, 0)} searches; ${(entry.durationMs / 1000).toFixed(1)}s\n`);
  }
  process.stdout.write(`${JSON.stringify(summarize(report), null, 2)}\n`);
  process.stdout.write(`Saved ${out}. Mark reviewItems[].supported true/false after checking cited pages to calculate factual citation accuracy.\n`);
}

function compare() {
  const first = option('--baseline');
  const second = option('--current');
  if (!first || !second) throw new Error('Provide --baseline PATH and --current PATH.');
  const baseline = JSON.parse(fs.readFileSync(first, 'utf8'));
  const current = JSON.parse(fs.readFileSync(second, 'utf8'));
  if (JSON.stringify(baseline.fixtureIds) !== JSON.stringify(current.fixtureIds)) throw new Error('Both reports must use the same fixtures in the same order.');
  process.stdout.write(`${JSON.stringify({ baseline: summarize(baseline), current: summarize(current) }, null, 2)}\n`);
}

if (command === 'run') run().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
else if (command === 'compare') { try { compare(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; } }
else { process.stderr.write('Usage: evaluate-planner.cjs run --live --variant baseline|optimized --label NAME --out PATH [--case ID] [--knowledge-from PATH] | compare --baseline PATH --current PATH\n'); process.exitCode = 1; }
