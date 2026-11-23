import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterHalls, text, sectionText, countByCat } from '../js/catalog.js';

const { halls } = JSON.parse(readFileSync(new URL('../data/halls.json', import.meta.url), 'utf8'));
const titles = (list, l = 'en') => list.map(h => text(h.name, l));

test('a hall is found by its name in any of the four languages', () => {
  for (const [q, l] of [['durian', 'en'], ['榴槤', 'zht'], ['榴梿', 'zhs'], ['durian', 'ms'], ['Mangga', 'ms']]) {
    const r = filterHalls(halls, { q, lang: l });
    assert.ok(r.length >= 1, q);
  }
  assert.equal(text(filterHalls(halls, { q: '榴梿', lang: 'zhs' })[0].name, 'en'), 'Durian');
});

test('a name match ranks above a passing mention', () => {
  assert.equal(titles(filterHalls(halls, { q: 'banana' }))[0], 'Banana');
});

test('every term must match', () => {
  assert.equal(filterHalls(halls, { q: 'durian zzzz' }).length, 0);
});

test('category filter and counts agree', () => {
  const n = countByCat(halls);
  for (const c of Object.keys(n)) assert.equal(filterHalls(halls, { cat: c }).length, n[c]);
});

test('English list is alphabetical', () => {
  const t = titles(filterHalls(halls, {}));
  assert.deepEqual(t, [...t].sort((a, b) => a.localeCompare(b, 'en')));
});

test('the second name is the MOA original for en/ms, English for Chinese', () => {
  const h = halls.find(x => x.id === 19);
  assert.equal(sectionText({ zht: '採後處理', zhs: '采后处理' }, 'zhs'), '采后处理');
  assert.equal(sectionText({ zht: '採後處理', zhs: '采后处理' }, 'en'), '採後處理');
});
