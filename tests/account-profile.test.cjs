/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { getAccountProfile } = require('../lib/auth/profile.ts');

test('Google profile displays the verified name, photo, email and join month', () => {
  const profile = getAccountProfile({
    email: 'guest@example.com',
    user_metadata: { full_name: 'Sam Traveller', avatar_url: 'https://lh3.googleusercontent.com/a/photo' },
    identities: [],
    created_at: '2026-09-18T00:00:00Z',
  }, 'fallback@example.com');
  assert.deepEqual(profile, {
    name: 'Sam Traveller', email: 'guest@example.com',
    avatar: 'https://lh3.googleusercontent.com/a/photo', joined: 'September 2026',
  });
});

test('missing profile details remain usable and reject unrelated image hosts', () => {
  const profile = getAccountProfile({
    email: 'guest@example.com',
    user_metadata: { avatar_url: 'https://googleusercontent.com.attacker.test/photo' },
    identities: [], created_at: 'invalid',
  }, 'fallback@example.com');
  assert.deepEqual(profile, { name: 'Traveller', email: 'guest@example.com', avatar: null, joined: null });
  assert.deepEqual(getAccountProfile(null, 'fallback@example.com'), {
    name: 'Traveller', email: 'fallback@example.com', avatar: null, joined: null,
  });
});
