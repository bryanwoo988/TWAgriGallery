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

test('section titles: English/Malay from the translation table, Chinese as MOA writes it', async () => {
  const { setSectionNames } = await import('../js/catalog.js');
  const { readFileSync } = await import('node:fs');
  const names = JSON.parse(readFileSync(new URL('../data/sections-i18n.json', import.meta.url), 'utf8'));
  setSectionNames(names);
  const o = { zht: '病害防治', zhs: '病害防治' };
  assert.equal(sectionText(o, 'en'), 'Disease control');
  assert.equal(sectionText(o, 'ms'), 'Kawalan penyakit');
  assert.equal(sectionText(o, 'zht'), '病害防治');
  assert.equal(sectionText({ zht: '從未翻譯的標題' }, 'en'), '從未翻譯的標題');  // falls back to MOA's title
  // every section in the hall list has both translations, with no Chinese left in them
  const { halls } = JSON.parse(readFileSync(new URL('../data/halls.json', import.meta.url), 'utf8'));
  for (const h of halls) for (const g of h.groups) for (const t of [g.zht, ...g.items.map(i => i.zht)]) {
    assert.ok(names[t], `no translation: ${t}`);
    for (const x of names[t]) assert.ok(!/[㐀-鿿]/.test(x), `${t} -> ${x}`);
  }
});
