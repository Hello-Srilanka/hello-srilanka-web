/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const blobs = new Map();
let version = 0;
const store = {
  async get(key) { return blobs.get(key)?.data ?? null; },
  async getWithMetadata(key) {
    const entry = blobs.get(key);
    return entry ? { data: entry.data, etag: entry.etag, metadata: entry.metadata } : null;
  },
  async setJSON(key, data, options = {}) {
    const old = blobs.get(key);
    if (options.onlyIfNew && old || options.onlyIfMatch && old?.etag !== options.onlyIfMatch) return { modified: false };
    const etag = String(++version);
    blobs.set(key, { data, etag, metadata: options.metadata || {} });
    return { modified: true, etag };
  },
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === '@netlify/blobs') return { getStore: () => store };
  if (request === '@/lib/supabase/config') return { supabaseConfigured: () => false };
  if (request === '@/lib/supabase/server') return { createClient: () => { throw new Error('Unexpected account access'); } };
  if (request.startsWith('@/')) return originalLoad.call(this, path.join(__dirname, '..', request.slice(2) + '.ts'), parent, isMain);
  return originalLoad.call(this, request, parent, isMain);
};
const jobs = require('../lib/planner/async-job.ts');
const { POST, GET } = require('../app/api/itinerary/route.ts');
const { defaults } = require('../lib/planner/model.ts');
Module._load = originalLoad;

test('Netlify planning returns quickly, deduplicates, and keeps completed output available after a dropped connection', async () => {
  const oldSite = process.env.SITE_ID, oldKey = process.env.OPENAI_API_KEY;
  process.env.SITE_ID = 'test-site';
  process.env.OPENAI_API_KEY = 'test-only-secret';
  try {
    const id = crypto.randomUUID();
    const preferences = { ...defaults, undecided: true, interests: ['Nature', 'Food'] };
    const request = () => new Request('https://example.com/api/itinerary', {
      method: 'POST', headers: { host: 'example.com', origin: 'https://example.com', 'content-type': 'application/json' },
      body: JSON.stringify({ id, preferences }),
    });
    const response = await POST(request());
    assert.equal(response.status, 202);
    const accepted = await response.json();
    assert.equal(accepted.status, 'queued');
    assert.equal(accepted.dispatchToken.length, 64);
    assert.equal((await POST(request())).status, 202);
    assert.equal(blobs.size, 1);
    assert.equal(jobs.validPlannerDispatchToken(id, blobs.get(id).data.hash, accepted.dispatchToken), true);
    assert.equal(jobs.validPlannerDispatchToken(id, blobs.get(id).data.hash, '0'.repeat(64)), false);

    const queued = await GET(new Request(`https://example.com/api/itinerary?id=${id}`));
    assert.equal((await queued.json()).status, 'queued');
    const claimed = await jobs.claimPlannerJob(id);
    assert.equal(claimed.status, 'running');
    assert.equal(await jobs.claimPlannerJob(id), null, 'the same work is not started twice');
    const result = { id, title: 'A sample route', mode: 'live' };
    await jobs.updatePlannerJob(id, { ...claimed, status: 'complete', stage: 'Your itinerary is ready', result });
    const completed = await GET(new Request(`https://example.com/api/itinerary?id=${id}`));
    assert.deepEqual((await completed.json()).result, result);
    assert.equal(blobs.get(id).metadata.expiresAt, claimed.createdAt + jobs.plannerJobTtl);
    const expired = { ...blobs.get(id).data, createdAt: Date.now() - jobs.plannerJobTtl - 1 };
    await jobs.updatePlannerJob(id, expired);
    assert.equal((await GET(new Request(`https://example.com/api/itinerary?id=${id}`))).status, 410);
    assert.equal((await POST(request())).status, 410);
  } finally {
    if (oldSite === undefined) delete process.env.SITE_ID; else process.env.SITE_ID = oldSite;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});
