import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, LANG_NAMES } from '../js/i18n.js';
import { LANGS, LIGHT_LOOKS, DARK_LOOKS, MODES } from '../js/prefs.js';

// The summary note is deliberately blank in Chinese: the overview is MOA's own text there.
const BLANK_OK = new Set(['summaryNote.zht', 'summaryNote.zhs', 'articlesInChinese.zht', 'articlesInChinese.zhs']);

test('every interface string exists in all four languages', () => {
  for (const [key, row] of Object.entries(STRINGS)) {
    for (const l of LANGS) {
      assert.equal(typeof row[l], 'string', `${key}.${l}`);
      if (!BLANK_OK.has(`${key}.${l}`)) assert.ok(row[l].trim(), `${key}.${l} is empty`);
    }
  }
});

test('every look and mode has a label', () => {
  for (const k of [...LIGHT_LOOKS, ...DARK_LOOKS, ...MODES]) assert.ok(STRINGS[k], k);
});

test('placeholders are filled', () => {
  assert.equal(t('results', { n: 3 }, 'en'), '3 halls');
  assert.equal(t('results', { n: 3 }, 'zht'), '3 個主題館');
});

test('each language names itself', () => {
  assert.deepEqual(Object.keys(LANG_NAMES).sort(), [...LANGS].sort());
});

// One language at a time: English and Malay text has no Chinese, Chinese text has
// no English words (language names in the language picker are the only exception).
test('each language uses only its own script, in the interface and the update notes', async () => {
  const { STRINGS } = await import('../js/i18n.js');
  const { RELEASES } = await import('../js/releases.js');
  const CJK = /[㐀-鿿]/, WORD = /[A-Za-z]{3,}/;
  const ALLOWED = /iPhone|iPad|Android|Wi-Fi|MB|GB|QR|MOA|A−|A\+/g;  // product names, units, the A−/A+ buttons
  for (const [k, r] of Object.entries(STRINGS)) {
    for (const l of ['en', 'ms']) assert.ok(!CJK.test(r[l] || ''), `${k}.${l} has Chinese: ${r[l]}`);
    for (const l of ['zht', 'zhs']) assert.ok(!WORD.test((r[l] || '').replace(ALLOWED, '')), `${k}.${l} has English: ${r[l]}`);
  }
  for (const rel of RELEASES) {
    for (const l of ['en', 'ms']) for (const t of rel.notes[l] || []) assert.ok(!CJK.test(t), `${rel.v} ${l}: ${t}`);
    for (const l of ['zh', 'zht']) for (const t of rel.notes[l] || []) assert.ok(!WORD.test(t.replace(ALLOWED, '')), `${rel.v} ${l}: ${t}`);
  }
});
