import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { t2s } from '../js/t2s.js';

test('matches OpenCC on every Chinese string in the hall data', () => {
  const { halls } = JSON.parse(readFileSync(new URL('../data/halls.json', import.meta.url), 'utf8'));
  const pairs = [];
  for (const h of halls) {
    pairs.push(h.name, h.intro, h.agency);
    for (const g of h.groups) { pairs.push(g); pairs.push(...g.items); }
  }
  const bad = pairs.filter(p => t2s(p.zht) !== p.zhs);
  assert.deepEqual(bad.slice(0, 5).map(p => [p.zht, t2s(p.zht), p.zhs]), []);
  assert.ok(pairs.length > 4000);
});

test('phrases before characters', () => {
  assert.equal(t2s('一目瞭然的臺灣農業'), '一目了然的台湾农业');
});
