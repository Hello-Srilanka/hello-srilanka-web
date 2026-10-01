/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS browser check. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { defaults } = require('../lib/planner/model.ts');
const { sampleDraft } = require('../lib/planner/sample.ts');
const { finalize } = require('../lib/planner/validation.ts');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const preferences = { ...defaults, undecided: true, interests: ['Nature'] };
    await page.addInitScript(p => sessionStorage.setItem('hellosrilanka-planner-session-v2', JSON.stringify({
      version: 2, flowVersion: 4, expiresAt: Date.now() + 3600000,
      preferences: p, step: 4, furthest: 4, editing: false, screen: 'form', requestId: null,
    })), preferences);
    let id, polls = 0, dispatches = 0;
    await page.route('**/.netlify/functions/generate-itinerary', route => {
      dispatches++;
      return route.fulfill({ status: 202 });
    });
    await page.route('**/api/itinerary**', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'POST') {
        const body = request.postDataJSON();
        if (id) assert.equal(body.id, id, 'retry reuses the original request');
        id = body.id;
        return route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({
          mode: 'live', status: 'queued', stage: 'Waiting for your planner', dispatchToken: 'test-token',
        }) });
      }
      if (!url.searchParams.has('id')) return route.fulfill({ contentType: 'application/json', body: '{"mode":"live"}' });
      assert.equal(url.searchParams.get('id'), id);
      polls++;
      if (polls === 1) return route.abort('failed');
      if (polls === 2) return route.fulfill({ contentType: 'application/json', body: '{"status":"running","stage":"Building your day-by-day journey"}' });
      const result = finalize(sampleDraft(preferences), preferences, [], id, 'sample');
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'complete', stage: 'Your itinerary is ready', result }) });
    });
    await page.goto((process.env.TEST_BASE_URL || 'http://localhost:3001') + '/plan');
    const create = page.getByRole('button', { name: 'Create my itinerary', exact: true });
    await create.waitFor({ timeout: 15000 });
    await create.click();
    await page.locator('#result-heading').waitFor({ timeout: 30000 });
    assert.ok(polls >= 3, 'polling recovered after a dropped connection');
    assert.equal(dispatches, 1, 'one background generation was started');
    assert.equal(await page.locator('.journal-day-nav a').count(), 7);
    assert.deepEqual(errors, []);
    console.log('PASS: a disconnected progress poll recovers and the same background itinerary appears.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
