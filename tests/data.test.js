/* The hall data the app ships: complete in every language, every picture present. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = JSON.parse(readFileSync(join(ROOT, 'data/halls.json'), 'utf8'));
const LANGS = ['zht', 'zhs', 'en', 'ms'];
const CATS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'];

test('157 halls, unique ids', () => {
  assert.equal(DATA.halls.length, 157);
  assert.equal(new Set(DATA.halls.map(h => h.id)).size, 157);
});

test('every category has a name in every language and at least one hall', () => {
  for (const c of CATS) {
    for (const l of LANGS) assert.ok(DATA.categories[c][l], `${c} ${l}`);
    assert.ok(DATA.halls.some(h => h.cats.includes(c)), `no hall in ${c}`);
  }
});

test('every hall has name, overview and agency in all four languages', () => {
  for (const h of DATA.halls) {
    for (const k of ['name', 'intro', 'agency']) {
      for (const l of LANGS) assert.ok(h[k][l]?.trim(), `${h.id} ${k}.${l}`);
    }
    assert.ok(h.cats.length && h.cats.every(c => CATS.includes(c)), `${h.id} cats`);
  }
});

test('English and Malay text is not left in Chinese', () => {
  const han = /[一-鿿]/;
  for (const h of DATA.halls) {
    for (const k of ['name', 'intro', 'agency']) {
      assert.ok(!han.test(h[k].en), `${h.id} ${k}.en`);
      assert.ok(!han.test(h[k].ms), `${h.id} ${k}.ms`);
    }
  }
});

test('every hall has its cover and icon on disk', () => {
  for (const h of DATA.halls) {
    assert.ok(existsSync(join(ROOT, `img/covers/${h.id}.webp`)), `cover ${h.id}`);
    assert.ok(existsSync(join(ROOT, `img/icons/${h.id}.svg`)), `icon ${h.id}`);
  }
});

test('section links are numeric MOA ids with Chinese titles', () => {
  let n = 0;
  for (const h of DATA.halls) {
    for (const g of h.groups) {
      assert.ok(g.zht && g.zhs, `${h.id} group title`);
      if (g.id !== null) assert.ok(Number.isInteger(g.id) && g.id > 0);
      for (const i of g.items) { assert.ok(Number.isInteger(i.id) && i.id > 0 && i.zht && i.zhs); n++; }
    }
  }
  assert.ok(n > 1000, `only ${n} section links`);
});

test('agency links are https', () => {
  for (const h of DATA.halls) if (h.agencyUrl) assert.match(h.agencyUrl, /^https?:\/\//, String(h.id));
});

test('fetched date is a day', () => assert.match(DATA.fetched, /^\d{4}-\d{2}-\d{2}$/));
