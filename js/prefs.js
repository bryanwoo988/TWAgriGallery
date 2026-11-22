/* Reader preferences: language and appearance.

   Owns storage. Applying them to the page is applyToDocument(), kept apart
   so the logic can be tested without a DOM. Storage may be missing or throw
   (private browsing, blocked site data): the app then runs on in-memory
   state and forgets on reload. */

import { PREFIX } from './config.js';

const KEY = `${PREFIX}.prefs.v1`;

// en is the default: the first screen reads for the widest audience.
export const LANGS = ['en', 'zht', 'zhs', 'ms'];
export const MODES = ['auto', 'light', 'dark'];
// Eight appearances: four light looks and four dark looks.
// `auto` follows the phone between the chosen light and dark look.
export const LIGHT_LOOKS = ['classic', 'paper', 'mint', 'lavender'];
export const DARK_LOOKS = ['midnight', 'oled', 'slate', 'grape'];
// Text size: small, normal, large, extra large (scales everything sized in rem).
export const SIZES = ['s', 'm', 'l', 'xl'];

const DEFAULTS = () => ({ lang: 'en', mode: 'auto', light: 'classic', dark: 'midnight', size: 'm', visited: false });

let state = DEFAULTS();
let store = null;
const listeners = new Set();

const pick = (list, v, d) => (list.includes(v) ? v : d);

export function sanitize(raw) {
  const d = DEFAULTS();
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    lang: pick(LANGS, r.lang, d.lang),
    mode: pick(MODES, r.mode, d.mode),
    light: pick(LIGHT_LOOKS, r.light, d.light),
    dark: pick(DARK_LOOKS, r.dark, d.dark),
    size: pick(SIZES, r.size, d.size),
    visited: r.visited === true,
  };
}

export function init(storage = globalThis.localStorage) {
  store = storage ?? null;
  let raw = {};
  try { raw = JSON.parse(store?.getItem(KEY) || '{}'); } catch { raw = {}; }
  state = sanitize(raw);
  return get();
}

function save() {
  try { store?.setItem(KEY, JSON.stringify(state)); } catch { /* full or blocked: keep going in memory */ }
  listeners.forEach(fn => fn(get()));
}

export const get = () => ({ ...state });
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };

export function set(patch) {
  state = sanitize({ ...state, ...patch });
  save();
  return get();
}

/* The look in force: `auto` resolves against the phone's setting. */
export function resolve(s = state, prefersDark = false) {
  const side = s.mode === 'auto' ? (prefersDark ? 'dark' : 'light') : s.mode;
  return { side, look: side === 'dark' ? s.dark : s.light };
}

const HTML_LANG = { en: 'en', zht: 'zh-Hant-TW', zhs: 'zh-Hans', ms: 'ms' };

export function applyToDocument(doc = document, prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches) {
  const r = doc.documentElement;
  const { side, look } = resolve(state, !!prefersDark);
  r.lang = HTML_LANG[state.lang];
  r.dataset.theme = side;
  r.dataset.look = look;
  r.dataset.size = state.size;
  // The browser bar takes the page colour of the chosen look.
  const bg = doc.defaultView?.getComputedStyle?.(r).getPropertyValue('--bg').trim();
  if (bg) doc.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg));
}
