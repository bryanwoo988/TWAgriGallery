/* Hall articles: loading, 简体 conversion and photos.

   data/h/<hall>.json holds a hall's sections and full article text in 繁體,
   as MOA publishes it. 简体 readers get it converted on the phone (t2s.js).
   Photos are stored by this app under img/p/; MOA's own image server cannot
   be cached by another site, so only photos copied here work offline. */

import { t2s } from './t2s.js';
import { italicizeIn } from './sciname.js';

/* Background downloads (hall text, photos) are only worth anything once the
   service worker controls the page: before that, nothing they fetch is kept,
   and on a first visit over a phone network that can take a while. */
export function whenControlled() {
  const sw = globalThis.navigator?.serviceWorker;
  if (!sw) return Promise.reject(new Error('no service worker'));
  if (sw.controller) return Promise.resolve();
  return new Promise(resolve => sw.addEventListener('controllerchange', () => resolve(), { once: true }));
}

/* The halls opened most recently stay parsed in memory; the rest are let go
   (all 157 together would be several hundred MB) and come back from the
   offline cache when opened again. */
const HALLS_KEPT = 6;
const halls = new Map();

export async function loadHall(id) {
  if (halls.has(id)) {
    const p = halls.get(id);
    halls.delete(id);
    halls.set(id, p);  // most recent last
    return p;
  }
  halls.set(id, fetch(`data/h/${id}.json`).then(r => {
    if (!r.ok) throw new Error(`hall ${id}: ${r.status}`);
    return r.json();
  }).catch(e => { halls.delete(id); throw e; }));
  while (halls.size > HALLS_KEPT) halls.delete(halls.keys().next().value);
  return halls.get(id);
}

let indexPromise = null;
// [articleId, hallId, sectionId, title] for every article, for search.
export function loadIndex() {
  indexPromise ??= fetch('data/index.json').then(r => r.json()).catch(e => { indexPromise = null; throw e; });
  return indexPromise;
}

export const zh = (s, lang) => (lang === 'zhs' ? t2s(s) : s ?? '');

/* Article titles in English and Malay (data/titles-i18n.json: {繁體 title: [en, ms]},
   built from tools/content/article_titles.tsv). A title not yet translated shows
   MOA's Chinese. */
let TITLES = {};
export function setTitles(map) { TITLES = map || {}; }
export function titleText(t, lang) {
  if ((lang === 'en' || lang === 'ms') && TITLES[t]) return TITLES[t][lang === 'en' ? 0 : 1] || t;
  return zh(t, lang);
}
export const translatedTitles = () => TITLES;

export const photoUrl = key => `img/p/${key}.webp`;

/* Article HTML from the build (already reduced to safe tags) into a fragment:
   photos resolved to local files, text converted for 简体 readers. */
const TAGS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SUP', 'SUB', 'UL', 'OL', 'LI', 'TABLE', 'THEAD',
  'TBODY', 'TR', 'TD', 'TH', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'HR']);
const ATTRS = { A: ['href', 'target', 'rel'], IMG: ['data-p', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'] };

/* Second line of defence after tools/build_articles.py: only the build's own
   tags and attributes survive, links must be http(s), photos must be keys. */
function sanitize(root) {
  for (const el of [...root.querySelectorAll('*')]) {
    if (!TAGS.has(el.tagName)) { el.replaceWith(...el.childNodes); continue; }
    const ok = ATTRS[el.tagName] || [];
    for (const a of [...el.attributes]) if (!ok.includes(a.name)) el.removeAttribute(a.name);
    if (el.tagName === 'A') {
      if (!/^https?:\/\//.test(el.getAttribute('href') || '')) el.removeAttribute('href');
      el.target = '_blank'; el.rel = 'noopener';
    }
    if (el.tagName === 'IMG' && !/^\w+$/.test(el.dataset.p || '')) el.remove();
  }
}

export function renderHtml(html, lang) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html || '';  // inert: nothing in a template runs or loads
  sanitize(tpl.content);
  for (const img of tpl.content.querySelectorAll('img[data-p]')) {
    img.src = photoUrl(img.dataset.p);
    img.loading = 'lazy';
    img.decoding = 'async';
    if (lang === 'zhs' && img.alt) img.alt = t2s(img.alt);
  }
  if (lang === 'zhs') {
    const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) n.nodeValue = t2s(n.nodeValue);
  }
  italicizeIn(tpl.content);
  return tpl.content;
}

// Every photo key a hall uses: for "save this hall's photos for offline".
export function hallPhotos(hall) {
  const keys = new Set();
  for (const a of Object.values(hall.articles)) {
    for (const g of a.gallery) keys.add(g.p);
    for (const b of [a.body, ...(a.answers || []).map(x => x.body)]) {
      for (const m of String(b).matchAll(/data-p="(\w+)"/g)) keys.add(m[1]);
    }
  }
  return [...keys];
}

// First photo of an article, for list thumbnails.
export function firstPhoto(a) {
  if (a.gallery[0]) return a.gallery[0].p;
  const m = String(a.body).match(/data-p="(\w+)"/);
  return m ? m[1] : null;
}

/* Saving a hall's photos: the service worker keeps every photo it serves in
   its photo cache, so fetching them all is enough. Progress goes to onStep. */
export async function saveHallPhotos(keys, onStep = () => {}) {
  await whenControlled();
  let done = 0, failed = 0;
  const queue = [...keys];
  const worker = async () => {
    while (queue.length) {
      const k = queue.shift();
      try { const r = await fetch(photoUrl(k)); if (!r.ok) throw 0; await r.blob(); } catch { failed++; }
      onStep(++done, keys.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return { done, failed };
}

export async function photosSaved(keys) {
  if (!('caches' in globalThis) || !keys.length) return 0;
  const cache = await caches.open('twagri-photos');
  let n = 0;
  for (const k of keys) if (await cache.match(new URL(photoUrl(k), location.href).href)) n++;
  return n;
}

/* Hall text for offline reading: fetched in the background once the app runs
   (the service worker keeps each response). A hall already stored is a quick
   cache hit; one that fails is tried again next time. */
export async function syncHalls(ids) {
  await whenControlled();
  const queue = [...ids];
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      try { const r = await fetch(`data/h/${id}.json`); if (r.ok) await r.blob(); } catch { /* offline */ }
    }
  };
  await Promise.all([worker(), worker()]);
}

/* Every photo, for "download all photos". One job for the whole app: it can be
   paused, and resumes on the next visit while the reader has it switched on. */
const ALL_KEY = 'twagri.allPhotos';      // 'on' while the reader wants every photo offline
const ASKED_KEY = 'twagri.askedPhotos';  // the first-visit question was answered

const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

export const allPhotos = {
  wanted: () => store.get(ALL_KEY) === 'on',
  asked: () => !!store.get(ASKED_KEY),
  markAsked: () => store.set(ASKED_KEY, '1'),
  state: { running: false, done: 0, total: 0, failed: 0, bytes: 0, finished: false },
  listeners: new Set(),
  emit() { for (const f of this.listeners) f(this.state); },
  list: null,
  async load() {
    this.list ??= fetch('data/photos.json').then(r => r.json()).catch(e => { this.list = null; throw e; });
    const l = await this.list;
    this.state.bytes = l.bytes;
    return l;
  },
  async start() {
    if (this.state.running) return;
    store.set(ALL_KEY, 'on');
    navigator.storage?.persist?.().catch(() => {});
    // Show the strip at once, even while waiting for the service worker.
    Object.assign(this.state, { running: true, failed: 0, finished: false });
    this.emit();
    let keys, cache;
    try {
      ({ keys } = await this.load());
      this.state.total = keys.length;
      this.emit();
      await whenControlled();
      cache = await caches.open('twagri-photos');
    } catch {  // no service worker or cache storage here: photos stay online-only
      this.state.running = false;
      this.emit();
      return;
    }
    if (!this.state.running) return;  // paused while waiting
    const have = new Set((await cache.keys()).map(r => r.url));
    const base = new URL('img/p/', location.href).href;
    const queue = keys.filter(k => !have.has(`${base}${k}.webp`));
    Object.assign(this.state, { total: keys.length, done: keys.length - queue.length });
    this.emit();
    const worker = async () => {
      while (queue.length && this.state.running) {
        const k = queue.shift();
        try { const r = await fetch(photoUrl(k)); if (!r.ok) throw 0; await r.blob(); this.state.done++; }
        catch { this.state.failed++; }
        this.emit();
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    const complete = this.state.running && !queue.length;
    this.state.running = false;
    this.state.finished = complete && !this.state.failed;
    this.emit();
  },
  pause() {
    store.set(ALL_KEY, 'off');
    this.state.running = false;
    this.emit();
  },
};
