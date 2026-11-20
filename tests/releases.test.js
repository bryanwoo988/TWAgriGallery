import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RELEASES, VERSION } from '../js/releases.js';

test('newest first, valid versions, no repeats', () => {
  const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
  for (const r of RELEASES) assert.match(r.v, /^\d+\.\d+\.\d+$/);
  for (let i = 1; i < RELEASES.length; i++) assert.ok(cmp(RELEASES[i - 1].v, RELEASES[i].v) > 0);
  assert.equal(VERSION, RELEASES[0].v);
});

test('each release has a date, a UTC time and notes in every language', () => {
  for (const r of RELEASES) {
    assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
    if (r.at) {
      assert.match(r.at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00Z$/);
      // date is the day in Malaysia (UTC+8)
      assert.equal(new Date(Date.parse(r.at) + 8 * 3600e3).toISOString().slice(0, 10), r.date, r.v);
    }
    for (const l of ['en', 'zh', 'zht', 'ms']) assert.ok(r.notes[l]?.length, `${r.v} ${l}`);
  }
});
