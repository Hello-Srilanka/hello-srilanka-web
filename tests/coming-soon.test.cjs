/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const { unstable_doesMiddlewareMatch: matches, getRewrittenUrl, getRedirectUrl } = require('next/experimental/testing/server');

const authCalls = [];
let authConfigured = true;
require.extensions['.ts'] = (mod, filename) => {
  const originalRequire = mod.require.bind(mod);
  mod.require = name => {
    if (name === '@/lib/supabase/config') return { supabaseConfigured: () => authConfigured };
    if (name === '@/lib/supabase/proxy') return {
      updateSession: async request => { authCalls.push(request.nextUrl.pathname); return NextResponse.next(); },
    };
    return originalRequire(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const { proxy, config } = require('../proxy.ts');
const originalFlag = process.env.COMING_SOON;
beforeEach(() => {
  delete process.env.COMING_SOON;
  authCalls.length = 0;
  authConfigured = true;
});
after(() => {
  if (originalFlag === undefined) delete process.env.COMING_SOON;
  else process.env.COMING_SOON = originalFlag;
});
const request = (path, init) => new NextRequest(`https://hellosrilanka.lk${path}`, init);

test('launch gate covers pages, APIs, auth callbacks and prefetches while allowing media and framework assets', () => {
  for (const url of ['/', '/coming-soon', '/plan', '/memories', '/login', '/account/itineraries/trip', '/auth/callback', '/api/itinerary', '/unknown.json', '/images-private']) {
    assert.equal(matches({ config, url }), true, url);
  }
  assert.equal(matches({ config, url: '/plan', headers: { 'next-router-prefetch': '1', rsc: '1' } }), true);
  for (const url of ['/_next/static/chunks/app.js', '/_next/image?url=test', '/images/hero-film-1200.webp', '/media/sri-lanka-desktop.webm', '/media/sri-lanka-mobile.mp4', '/public/icons.svg', '/icon.svg', '/favicon.ico']) {
    assert.equal(matches({ config, url }), false, url);
  }
});

test('coming soon mode rewrites the homepage and permits the separate page without a redirect loop', async () => {
  process.env.COMING_SOON = 'true';
  const home = await proxy(request('/?campaign=launch'));
  assert.equal(getRewrittenUrl(home), 'https://hellosrilanka.lk/coming-soon');
  assert.equal(home.headers.get('cache-control'), 'no-store');
  assert.equal(home.headers.get('x-robots-tag'), 'noindex, nofollow');
  const page = await proxy(request('/coming-soon'));
  assert.equal(page.headers.get('x-middleware-next'), '1');
  assert.equal(getRedirectUrl(page), null);
  assert.deepEqual(authCalls, []);
});

test('direct full-app URLs and RSC requests temporarily redirect home and discard their query strings', async () => {
  process.env.COMING_SOON = 'true';
  for (const path of ['/plan', '/memories', '/login', '/signup', '/account/itineraries/trip', '/admin', '/auth/callback?code=test', '/unknown.json']) {
    const response = await proxy(request(path, { headers: { rsc: '1' } }));
    assert.equal(response.status, 307, path);
    assert.equal(getRedirectUrl(response), 'https://hellosrilanka.lk/', path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.deepEqual(authCalls, []);
});

test('coming soon mode stops API requests and Server Actions instead of forwarding them', async () => {
  process.env.COMING_SOON = 'true';
  for (const [path, method] of [['/api/itinerary', 'GET'], ['/api/itinerary', 'POST'], ['/login', 'POST'], ['/coming-soon', 'POST'], ['/', 'POST']]) {
    const response = await proxy(request(path, { method, headers: { 'next-action': 'test-action' } }));
    assert.equal(response.status, 503, `${method} ${path}`);
    assert.match((await response.json()).error, /coming soon/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(getRedirectUrl(response), null);
  }
  assert.deepEqual(authCalls, []);
});

test('unset or false flag restores app routes and keeps session refresh on the existing auth routes', async () => {
  for (const flag of [undefined, 'false']) {
    if (flag === undefined) delete process.env.COMING_SOON;
    else process.env.COMING_SOON = flag;
    for (const path of ['/', '/plan', '/memories', '/api/itinerary', '/login-extra']) {
      const response = await proxy(request(path));
      assert.equal(response.headers.get('x-middleware-next'), '1');
      assert.equal(getRewrittenUrl(response), null);
    }
    assert.deepEqual(authCalls, []);
    for (const path of ['/login', '/signup', '/account', '/account/itineraries/trip', '/admin', '/auth/callback']) {
      await proxy(request(path));
      assert.equal(authCalls.at(-1), path);
    }
    authCalls.length = 0;
  }
  authConfigured = false;
  assert.equal((await proxy(request('/login'))).headers.get('x-middleware-next'), '1');
  assert.deepEqual(authCalls, []);
});
