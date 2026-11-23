/* Article title translations: well formed, numbered against the fixed list,
   and English/Malay without Chinese left in them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = JSON.parse(readFileSync(new URL('../tools/content/article_titles_src.json', import.meta.url), 'utf8'));
const lines = readFileSync(new URL('../tools/content/article_titles.tsv', import.meta.url), 'utf8').split('\n').filter(Boolean);
const built = JSON.parse(readFileSync(new URL('../data/titles-i18n.json', import.meta.url), 'utf8'));

test('every line is number, English, Malay, for a title in the list, once', () => {
  const seen = new Set();
  for (const l of lines) {
    const [n, en, ms, extra] = l.split('\t');
    assert.ok(/^\d+$/.test(n) && +n < src.length, l);
    assert.ok(en?.trim() && ms?.trim() && extra === undefined, l);
    assert.ok(!seen.has(n), `duplicate ${n}`);
    seen.add(n);
    assert.ok(!/[㐀-鿿]/.test(en + ms), `Chinese left in ${n}: ${en} / ${ms}`);
  }
});

test('data/titles-i18n.json is current (run python3 tools/build_title_i18n.py)', () => {
  assert.equal(Object.keys(built).length, new Set(lines.map(l => src[+l.split('\t')[0]])).size);
});
