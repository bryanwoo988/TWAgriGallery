import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, LANG_NAMES } from '../js/i18n.js';
import { LANGS, LIGHT_LOOKS, DARK_LOOKS, MODES } from '../js/prefs.js';

// The summary note is deliberately blank in Chinese: the overview is MOA's own text there.
const BLANK_OK = new Set(['summaryNote.zht', 'summaryNote.zhs']);

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
