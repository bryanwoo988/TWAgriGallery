import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as prefs from '../js/prefs.js';

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('first visit: English, auto, classic/midnight', () => {
  const p = prefs.init(mem());
  assert.deepEqual(p, { lang: 'en', mode: 'auto', light: 'classic', dark: 'midnight', visited: false });
});

test('eight looks: four light, four dark', () => {
  assert.equal(prefs.LIGHT_LOOKS.length + prefs.DARK_LOOKS.length, 8);
});

test('bad stored values fall back to defaults', () => {
  const p = prefs.init(mem({ 'twagri.prefs.v1': JSON.stringify({ lang: 'fr', mode: 'neon', light: 'grape', dark: 'paper' }) }));
  assert.equal(p.lang, 'en'); assert.equal(p.mode, 'auto'); assert.equal(p.light, 'classic'); assert.equal(p.dark, 'midnight');
});

test('corrupt or throwing storage still starts', () => {
  assert.equal(prefs.init(mem({ 'twagri.prefs.v1': '{nope' })).lang, 'en');
  assert.equal(prefs.init({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }).lang, 'en');
  assert.equal(prefs.set({ lang: 'ms' }).lang, 'ms');
});

test('choices persist', () => {
  const s = mem();
  prefs.init(s);
  prefs.set({ lang: 'zhs', mode: 'dark', dark: 'oled' });
  const again = prefs.init(s);
  assert.equal(again.lang, 'zhs'); assert.equal(again.dark, 'oled');
});

test('auto follows the phone', () => {
  const s = { mode: 'auto', light: 'mint', dark: 'slate' };
  assert.deepEqual(prefs.resolve(s, false), { side: 'light', look: 'mint' });
  assert.deepEqual(prefs.resolve(s, true), { side: 'dark', look: 'slate' });
  assert.deepEqual(prefs.resolve({ ...s, mode: 'light' }, true), { side: 'light', look: 'mint' });
});
