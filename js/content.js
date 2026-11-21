/* Hall articles: loading, 简体 conversion and photos.

   data/h/<hall>.json holds a hall's sections and full article text in 繁體,
   as MOA publishes it. 简体 readers get it converted on the phone (t2s.js).
   Photos are stored by this app under img/p/; MOA's own image server cannot
   be cached by another site, so only photos copied here work offline. */

import { t2s } from './t2s.js';

const halls = new Map();

export async function loadHall(id) {
  if (!halls.has(id)) {
    halls.set(id, fetch(`data/h/${id}.json`).then(r => {
      if (!r.ok) throw new Error(`hall ${id}: ${r.status}`);
      return r.json();
    }).catch(e => { halls.delete(id); throw e; }));
  }
  return halls.get(id);
}

let indexPromise = null;
// [articleId, hallId, sectionId, title] for every article, for search.
export function loadIndex() {
  indexPromise ??= fetch('data/index.json').then(r => r.json()).catch(e => { indexPromise = null; throw e; });
  return indexPromise;
}

export const zh = (s, lang) => (lang === 'zhs' ? t2s(s) : s ?? '');

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
