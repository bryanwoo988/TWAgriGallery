/* Saved articles and reading history, kept on this phone only.

   Each entry is { h: hall id, a: article id, t: title (繁體, as MOA wrote it),
   at: time in ms }. Recent holds the last 30 articles opened, newest first;
   saved holds what the reader starred, newest first. Storage may be missing
   or throw (private browsing): the lists then live in memory until reload. */

import { PREFIX } from './config.js';

const KEY = `${PREFIX}.library.v1`;
export const RECENT_MAX = 30;

const clean = list => (Array.isArray(list) ? list : [])
  .filter(x => x && Number.isInteger(x.h) && Number.isInteger(x.a) && typeof x.t === 'string')
  .map(({ h, a, t, at }) => ({ h, a, t, at: Number(at) || 0 }));

export function createLibrary(storage = globalThis.localStorage) {
  let data = { saved: [], recent: [] };
  try {
    const raw = JSON.parse(storage?.getItem(KEY) || '{}');
    data = { saved: clean(raw.saved), recent: clean(raw.recent).slice(0, RECENT_MAX) };
  } catch { /* unreadable: start empty */ }
  const save = () => { try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* full or blocked */ } };
  const same = (x, h, a) => x.h === h && x.a === a;

  return {
    saved: () => data.saved.map(x => ({ ...x })),
    recent: () => data.recent.map(x => ({ ...x })),
    last: () => (data.recent[0] ? { ...data.recent[0] } : null),
    isSaved: (h, a) => data.saved.some(x => same(x, h, a)),
    // Star or unstar; returns whether it is now saved.
    toggle({ h, a, t }, now = Date.now()) {
      const was = data.saved.some(x => same(x, h, a));
      data.saved = was ? data.saved.filter(x => !same(x, h, a)) : [{ h, a, t, at: now }, ...data.saved];
      save();
      return !was;
    },
    visit({ h, a, t }, now = Date.now()) {
      data.recent = [{ h, a, t, at: now }, ...data.recent.filter(x => !same(x, h, a))].slice(0, RECENT_MAX);
      save();
    },
    clearRecent() { data.recent = []; save(); },
  };
}
