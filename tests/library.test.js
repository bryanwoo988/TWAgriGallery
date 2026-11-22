/* Saved articles and reading history. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLibrary, RECENT_MAX } from '../js/library.js';

const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };

test('starring toggles, newest first, and survives a reload', () => {
  const s = memory();
  const lib = createLibrary(s);
  assert.equal(lib.toggle({ h: 19, a: 1, t: '金煌' }, 1), true);
  assert.equal(lib.toggle({ h: 19, a: 2, t: '愛文' }, 2), true);
  assert.deepEqual(lib.saved().map(x => x.a), [2, 1]);
  assert.equal(lib.toggle({ h: 19, a: 1, t: '金煌' }, 3), false);
  assert.equal(createLibrary(s).isSaved(19, 2), true);
  assert.equal(createLibrary(s).isSaved(19, 1), false);
});

test('recent keeps one entry per article, newest first, at most 30', () => {
  const lib = createLibrary(memory());
  for (let i = 0; i < 40; i++) lib.visit({ h: 1, a: i, t: `t${i}` }, i);
  lib.visit({ h: 1, a: 35, t: 't35' }, 100);
  const r = lib.recent();
  assert.equal(r.length, RECENT_MAX);
  assert.equal(r[0].a, 35);
  assert.equal(r.filter(x => x.a === 35).length, 1);
  assert.equal(lib.last().a, 35);
});

test('broken or missing storage never stops the app', () => {
  const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  const lib = createLibrary(bad);
  lib.visit({ h: 1, a: 2, t: 'x' });
  assert.equal(lib.last().a, 2);
  const junk = memory(); junk.setItem('twagri.library.v1', '{"saved":[{"h":"x"}],"recent":"no"}');
  assert.deepEqual(createLibrary(junk).saved(), []);
  assert.equal(createLibrary(null).last(), null);
});
