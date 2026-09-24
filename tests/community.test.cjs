/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { filterPosts, validatePost } = require('../lib/community/model.ts');
const { seedPosts } = require('../lib/community/data.ts');
const filters = { tab: 'discover', destination: '', topic: '', query: '', saved: [], hidden: [] };
test('community combines search, place and experience filters, excluding hidden saved stories', () => {
  const post = seedPosts[0];
  const found = filterPosts(seedPosts, { ...filters, destination: post.destination, topic: post.topic, query: post.title.toUpperCase() });
  assert.deepEqual(found.map(p => p.id), [post.id]);
  assert.deepEqual(filterPosts(seedPosts, { ...filters, tab: 'saved', saved: [post.id], hidden: [post.id] }), []);
  assert.deepEqual(filterPosts(seedPosts, { ...filters, query: 'not-a-real-place' }), []);
});
test('personal journal and questions stay distinct; latest is sorted without changing source order', () => {
  const own = { ...seedPosts[0], id: 'local', authorId: 'you', createdAt: '2030-01-01T00:00:00Z' };
  const posts = [...seedPosts, own];
  assert.deepEqual(filterPosts(posts, { ...filters, tab: 'mine' }), [own]);
  const questions = filterPosts(posts, { ...filters, tab: 'questions' });
  assert.ok(questions.length > 0 && questions.every(p => p.kind === 'question'));
  assert.equal(filterPosts(posts, { ...filters, tab: 'latest' })[0].id, 'local');
  assert.equal(posts.at(-1).id, 'local');
});
test('photo moments require photographs while questions and stories can use words alone', () => {
  const draft = { kind: 'moment', title: 'An afternoon in Ella', body: 'We took the long way through the hills.', destination: 'Ella', photos: [] };
  assert.match(validatePost(draft), /photograph/);
  assert.equal(validatePost({ ...draft, kind: 'question' }), '');
  assert.equal(validatePost({ ...draft, kind: 'story' }), '');
  assert.match(validatePost({ ...draft, title: '    ' }), /title/);
  assert.match(validatePost({ ...draft, body: '    ' }), /detail/);
  assert.match(validatePost({ ...draft, destination: 'Unknown' }), /where/);
  assert.match(validatePost({ ...draft, photos: Array(5).fill({ src: 'test', alt: 'Test photo' }) }), /four/);
});
