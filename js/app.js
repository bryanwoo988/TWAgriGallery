/* Taiwan Agri Gallery: MOA's 157 theme halls with their full articles, offline.

   Routes (hash):
     #/              all halls          #/c/B          one category
     #/h/19          one hall           #/s/19/860     one section's articles
     #/a/19/10694    one article        #/settings
   The search text lives in memory, so going back to the list keeps it. */

import * as prefs from './prefs.js';
import { t, LANG_NAMES } from './i18n.js';
import { text, sectionText, altName, filterHalls, countByCat, norm } from './catalog.js';
import { APP_URL, MOA_LIST, hallUrl, sectionUrl, PREFIX } from './config.js';
import { RELEASES, VERSION } from './releases.js';
import { renderShare } from './share.js';
import { loadHall, loadIndex, zh, renderHtml, photoUrl, hallPhotos, firstPhoto, saveHallPhotos, photosSaved, syncHalls, allPhotos } from './content.js';
import { t2s } from './t2s.js';
import { setLexicon, sciNodes } from './sciname.js';

const $ = s => document.querySelector(s);
const main = $('#main');
const CAT_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'];
const EXT = { target: '_blank', rel: 'noopener' };

let DATA = null;
let query = '';
const hays = new Map();
const scrollMemory = new Map();
let lastRoute = '';
let renderToken = 0;

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style') n.setAttribute('style', v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : String(k));
  return n;
}

const lang = () => prefs.get().lang;
const tr = (k, v) => t(k, v, lang());
const hallById = id => DATA.halls.find(x => x.id === id);
const iconStyle = id => `-webkit-mask-image:url(img/icons/${id}.svg);mask-image:url(img/icons/${id}.svg)`;
const isZh = () => lang() === 'zht' || lang() === 'zhs';

/* ---------- Shell ---------- */

function renderHeader() {
  $('#app-title').textContent = tr('appName');
  $('#settings-link').setAttribute('aria-label', tr('settings'));
  $('#settings-link').title = tr('settings');
  document.title = tr('appName');
}

function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  let m;
  if ((m = h.match(/^\/a\/(\d+)\/(\d+)/))) return { name: 'article', hall: +m[1], id: +m[2] };
  if ((m = h.match(/^\/s\/(\d+)\/(\d+)/))) return { name: 'section', hall: +m[1], id: +m[2] };
  if ((m = h.match(/^\/h\/(\d+)/))) return { name: 'hall', id: +m[1] };
  if (h.startsWith('/settings')) return { name: 'settings' };
  const c = h.match(/^\/c\/([A-Z])/);
  return { name: 'list', cat: c && CAT_ORDER.includes(c[1]) ? c[1] : '' };
}

let lastList = '#/';

async function render() {
  scrollMemory.set(lastRoute || '#/', scrollY);
  const token = ++renderToken;
  renderHeader();
  const r = route();
  const key = location.hash || '#/';
  document.body.dataset.view = r.name;
  if (r.name === 'list') lastList = key;
  if (!DATA) { main.replaceChildren(el('p', { class: 'loading' }, '…')); return; }
  try {
    if (r.name === 'hall') await renderHall(r.id, token);
    else if (r.name === 'section') await renderSection(r.hall, r.id, token);
    else if (r.name === 'article') await renderArticle(r.hall, r.id, token);
    else if (r.name === 'settings') renderSettings();
    else renderList(r.cat);
  } catch (e) {
    if (token === renderToken) main.replaceChildren(el('p', { class: 'loading' }, tr('loadFailed')));
    return;
  }
  if (token !== renderToken) return;
  const y = scrollMemory.get(key) ?? 0;
  requestAnimationFrame(() => scrollTo(0, y));
  lastRoute = key;
}

const loading = () => main.replaceChildren(el('p', { class: 'loading' }, '…'));

/* ---------- List ---------- */

function chip(label, count, href, active) {
  return el('a', { class: 'chip' + (active ? ' is-active' : ''), href, 'aria-current': active ? 'page' : null },
    label, el('span', { class: 'chip-n' }, count));
}

function card(h) {
  const L = lang();
  return el('a', { class: 'card', href: `#/h/${h.id}` },
    el('div', { class: 'card-img' },
      el('img', { src: `img/covers/${h.id}.webp`, alt: '', loading: 'lazy', decoding: 'async', width: 400, height: 178 })),
    el('div', { class: 'card-body' },
      el('span', { class: 'hall-icon', 'aria-hidden': 'true', style: iconStyle(h.id) }),
      el('div', { class: 'card-text' },
        el('h3', { class: 'card-title' }, text(h.name, L)),
        el('p', { class: 'card-alt' }, altName(h, L)))));
}

// Articles whose title contains every search term (either script).
export function searchArticles(index, q, max = 60) {
  const terms = norm(q).split(' ').filter(Boolean);
  if (!terms.length || terms.join('').length < 2) return [];
  const out = [];
  for (const row of index) {
    const t = norm(row[3]);
    const s = norm(t2s(row[3]));
    if (terms.every(x => t.includes(x) || s.includes(x))) { out.push(row); if (out.length >= max) break; }
  }
  return out;
}

function renderList(cat) {
  const L = lang();
  const counts = countByCat(DATA.halls);
  const chips = el('nav', { class: 'chips', 'aria-label': tr('all') },
    chip(tr('all'), DATA.halls.length, '#/', !cat),
    CAT_ORDER.map(c => chip(text(DATA.categories[c], L), counts[c] || 0, `#/c/${c}`, cat === c)));

  const grid = el('div', { class: 'grid' });
  const status = el('p', { class: 'status', role: 'status' });
  const arts = el('section', { class: 'art-results' });
  const input = el('input', {
    type: 'search', class: 'search-input', placeholder: tr('search'), 'aria-label': tr('search'),
    value: query, autocomplete: 'off', enterkeyhint: 'search',
  });
  let seq = 0;
  const fill = async () => {
    const list = filterHalls(DATA.halls, { cat, q: query, lang: L }, hays);
    grid.replaceChildren(...list.map(card));
    status.textContent = list.length ? tr('results', { n: list.length }) : (norm(query) ? tr('none', { q: query }) : '');
    arts.replaceChildren();
    if (norm(query).length < 2) return;
    const mine = ++seq;
    let index;
    try { index = await loadIndex(); } catch { return; }
    if (mine !== seq) return;
    const hits = searchArticles(index, query).filter(r => !cat || hallById(r[1])?.cats.includes(cat));
    if (!hits.length) return;
    arts.append(el('h2', { class: 'sub' }, tr('articleResults', { n: hits.length })),
      el('ul', { class: 'art-list' }, hits.map(([aid, hid, , title]) => el('li', {},
        el('a', { href: `#/a/${hid}/${aid}` },
          el('span', { class: 'art-title' }, sciNodes(zh(title, L))),
          el('span', { class: 'art-meta' }, text(hallById(hid)?.name, L)))))));
  };
  input.addEventListener('input', () => { query = input.value; fill(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });

  const intro = el('section', { class: 'hero' },
    el('p', { class: 'hero-tag' }, tr('tagline')),
    el('div', { class: 'search' }, el('span', { class: 'search-icon', 'aria-hidden': 'true' }), input));

  main.replaceChildren(intro, chips, status, grid, arts);
  fill();
  chips.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ---------- Hall ---------- */

function chineseNote() {
  return isZh() ? null : el('p', { class: 'note' }, tr('articlesInChinese'));
}

function sectionLink(hallId, s, title) {
  const links = s.l?.length || 0;
  if (s.a.length === 1 && !links) {
    return el('a', { href: `#/a/${hallId}/${s.a[0]}` }, title, el('span', { class: 'count' }, 1));
  }
  if (s.a.length) {
    return el('a', { href: `#/s/${hallId}/${s.id}` }, title, el('span', { class: 'count' }, s.a.length));
  }
  // Only items that open online (news reprints, outside links, files).
  if (links) return el('a', { href: `#/s/${hallId}/${s.id}`, class: 'ext' }, title, ' ↗');
  if (s.kind === 'link') return el('a', { href: sectionUrl(s.id), ...EXT, class: 'ext' }, title, ' ↗');
  return null;
}

async function renderHall(id, token) {
  const L = lang();
  const h = hallById(id);
  if (!h) { location.replace('#/'); return; }
  loading();
  const data = await loadHall(id);
  if (token !== renderToken) return;
  const secs = new Map(data.sections.map(s => [s.id, s]));
  const nArticles = Object.keys(data.articles).length;

  const groups = h.groups.map(g => {
    const own = g.id ? secs.get(g.id) : null;
    const head = own ? (sectionLink(id, own, sectionText(g, L)) || sectionText(g, L)) : sectionText(g, L);
    const items = g.items.map(i => sectionLink(id, secs.get(i.id) || { kind: 'empty', a: [] }, sectionText(i, L))).filter(Boolean);
    if (!items.length && !(own && own.kind !== 'empty')) return null;
    return el('li', { class: 'group' },
      el('div', { class: 'group-title' }, head),
      items.length ? el('ul', { class: 'items' }, items.map(a => el('li', {}, a))) : null);
  }).filter(Boolean);

  const keys = hallPhotos(data);
  const photoBox = el('div', { class: 'photo-save' });
  const note = tr('summaryNote');
  main.replaceChildren(el('article', { class: 'hall' },
    el('a', { class: 'back', href: lastList }, '← ', tr('back')),
    el('div', { class: 'hall-cover' },
      el('img', { src: `img/covers/${h.id}.webp`, alt: text(h.name, L), width: 400, height: 178 })),
    el('header', { class: 'hall-head' },
      el('span', { class: 'hall-icon big', 'aria-hidden': 'true', style: iconStyle(h.id) }),
      el('div', {},
        el('h2', { class: 'hall-title' }, text(h.name, L)),
        el('p', { class: 'hall-alt' }, altName(h, L)),
        el('p', { class: 'hall-cats' }, h.cats.map(c => el('a', { class: 'tag', href: `#/c/${c}` }, text(DATA.categories[c], L)))))),
    el('section', { class: 'panel' },
      el('h3', {}, tr('overview')),
      el('p', { class: 'intro' }, sciNodes(text(h.intro, L))),
      note ? el('p', { class: 'fine' }, note) : null),
    el('section', { class: 'panel' },
      el('h3', {}, tr('sections'), el('span', { class: 'count' }, tr('nArticles', { n: nArticles }))),
      chineseNote(),
      groups.length ? el('ul', { class: 'groups' }, groups) : el('p', { class: 'fine' }, tr('noArticles')),
      keys.length ? photoBox : null),
    el('p', { class: 'agency' }, tr('maintainer'), ': ',
      h.agencyUrl ? el('a', { href: h.agencyUrl, ...EXT }, text(h.agency, L)) : text(h.agency, L),
      ' · ', el('a', { href: hallUrl(h.id), ...EXT }, tr('viewOnMoa'), ' ↗'))));
  if (keys.length) renderPhotoSave(photoBox, keys);
}

async function renderPhotoSave(box, keys) {
  const saved = await photosSaved(keys).catch(() => 0);
  const status = el('span', { class: 'fine', role: 'status' });
  const btn = el('button', { type: 'button', class: 'button' }, tr('savePhotos', { n: keys.length }));
  const show = n => {
    status.textContent = n >= keys.length ? tr('photosSaved') : n ? tr('photosPartly', { n, t: keys.length }) : tr('photosOnline');
    btn.hidden = n >= keys.length;
  };
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    navigator.storage?.persist?.().catch(() => {});
    const r = await saveHallPhotos(keys, (d, t) => { status.textContent = tr('savingPhotos', { n: d, t }); });
    btn.disabled = false;
    show(keys.length - r.failed);
  });
  show(saved);
  box.replaceChildren(btn, status);
}

/* ---------- Section ---------- */

async function renderSection(hallId, sid, token) {
  const L = lang();
  const h = hallById(hallId);
  if (!h) { location.replace('#/'); return; }
  loading();
  const data = await loadHall(hallId);
  if (token !== renderToken) return;
  const s = data.sections.find(x => x.id === sid);
  if (!s) { location.replace(`#/h/${hallId}`); return; }
  const items = s.a.map(aid => {
    const a = data.articles[aid];
    const ph = firstPhoto(a);
    return el('li', {}, el('a', { class: 'art-row', href: `#/a/${hallId}/${aid}` },
      ph ? el('img', { class: 'thumb', src: photoUrl(ph), alt: '', loading: 'lazy', decoding: 'async' }) : el('span', { class: 'thumb none', style: iconStyle(hallId) }),
      el('span', { class: 'art-text' },
        el('span', { class: 'art-title' }, sciNodes(zh(a.t, L))),
        el('span', { class: 'art-meta' }, a.qa ? tr('question') + ' · ' : '', a.upd || a.pub || ''))));
  });
  const online = (s.l || []).map(([t, u]) => el('li', {}, el('a', { href: u, ...EXT, class: 'ext' }, zh(t, L), ' ↗')));
  main.replaceChildren(el('div', { class: 'hall' },
    el('a', { class: 'back', href: `#/h/${hallId}` }, '← ', text(h.name, L)),
    el('h2', { class: 'page-title' }, zh(s.t, L)),
    s.a.length ? el('p', { class: 'fine' }, tr('nArticles', { n: s.a.length })) : null,
    chineseNote(),
    s.a.length ? el('ul', { class: 'art-list rows' }, items) : null,
    online.length ? el('h3', { class: 'sub' }, tr('moreOnline')) : null,
    online.length ? el('ul', { class: 'files online' }, online) : null,
    el('p', {}, el('a', { href: sectionUrl(s.id), ...EXT, class: 'ext' }, tr('viewOnMoa'), ' ↗'))));
}

/* ---------- Article ---------- */

async function renderArticle(hallId, aid, token) {
  const L = lang();
  const h = hallById(hallId);
  if (!h) { location.replace('#/'); return; }
  loading();
  const data = await loadHall(hallId);
  if (token !== renderToken) return;
  const a = data.articles[aid];
  if (!a) { location.replace(`#/h/${hallId}`); return; }
  const sec = data.sections.find(x => x.a.includes(aid));
  const back = sec && sec.a.length > 1 ? `#/s/${hallId}/${sec.id}` : `#/h/${hallId}`;
  const backLabel = sec && sec.a.length > 1 ? zh(sec.t, L) : text(h.name, L);

  // Previous / next within the section.
  const i = sec ? sec.a.indexOf(aid) : -1;
  const prev = i > 0 ? sec.a[i - 1] : null, next = sec && i < sec.a.length - 1 ? sec.a[i + 1] : null;

  const dates = [a.pub && `${tr(a.qa ? 'asked' : 'published')} ${a.pub}`, a.upd && `${tr('updated')} ${a.upd}`].filter(Boolean).join(' · ');
  const gallery = a.gallery.length ? el('section', { class: 'gallery' },
    el('h3', {}, tr('photos')),
    el('div', { class: 'gallery-grid' }, a.gallery.map(g => el('figure', {},
      el('img', { src: photoUrl(g.p), alt: zh(g.c, L), loading: 'lazy', decoding: 'async' }),
      g.c ? el('figcaption', {}, sciNodes(zh(g.c, L))) : null)))) : null;
  const fileList = files => files.length ? el('ul', { class: 'files' }, files.map(f =>
    el('li', {}, el('a', { href: f.u, ...EXT }, zh(f.n, L), ' ↗')))) : null;
  const answers = (a.answers || []).map(x => el('section', { class: 'answer' },
    el('h3', {}, tr('expertReply'), x.d ? el('span', { class: 'art-meta' }, ' · ', x.d) : null),
    el('div', { class: 'prose' }, renderHtml(x.body, L)),
    fileList(x.files)));

  main.replaceChildren(el('article', { class: 'hall reader' },
    el('a', { class: 'back', href: back }, '← ', backLabel),
    el('p', { class: 'kicker' }, el('a', { href: `#/h/${hallId}` }, text(h.name, L))),
    el('h2', { class: 'page-title' }, sciNodes(zh(a.t, L))),
    dates ? el('p', { class: 'fine' }, dates) : null,
    chineseNote(),
    a.qa ? el('h3', { class: 'qa-label' }, tr('question')) : null,
    el('div', { class: 'prose' }, renderHtml(a.body, L)),
    gallery,
    ...answers,
    a.files.length ? el('section', {}, el('h3', {}, tr('attachments')), el('p', { class: 'fine' }, tr('attachmentsNote')), fileList(a.files)) : null,
    el('nav', { class: 'prevnext' },
      prev ? el('a', { href: `#/a/${hallId}/${prev}` }, '← ', zh(data.articles[prev].t, L)) : el('span'),
      next ? el('a', { href: `#/a/${hallId}/${next}`, class: 'next' }, zh(data.articles[next].t, L), ' →') : el('span')),
    el('p', { class: 'agency' }, tr('source'), ': ', el('a', { href: `https://kmweb.moa.gov.tw/subject/subject.php?id=${aid}`, ...EXT }, tr('viewOnMoa'), ' ↗'))));
}

/* ---------- Settings ---------- */

function seg(options, current, onPick, label) {
  return el('div', { class: 'seg', role: 'radiogroup', 'aria-label': label },
    options.map(([value, name]) => el('button', {
      type: 'button', role: 'radio', class: 'seg-btn' + (value === current ? ' is-on' : ''),
      'aria-checked': value === current ? 'true' : 'false', onclick: () => onPick(value),
    }, name)));
}

function swatches(looks, current, side, onPick) {
  return el('div', { class: 'swatches' }, looks.map(look => el('button', {
    type: 'button', class: 'swatch' + (look === current ? ' is-on' : ''), 'aria-pressed': look === current ? 'true' : 'false',
    'data-theme': side, 'data-look': look, onclick: () => onPick(look),
  }, el('span', { class: 'swatch-preview', 'aria-hidden': 'true' }, el('i'), el('i'), el('i')), el('span', { class: 'swatch-name' }, tr(look)))));
}

// A tapped look must show at once: Auto stays only if it already shows that side.
function modeFor(side, p) {
  const now = prefs.resolve(p, matchMedia('(prefers-color-scheme: dark)').matches).side;
  return p.mode === 'auto' && now === side ? 'auto' : side;
}

// How much is on this phone: hall text files cached, storage in use.
function offlinePanel() {
  const status = el('p', { class: 'fine', role: 'status' }, '…');
  (async () => {
    try {
      const n = 'caches' in self ? (await (await caches.open('twagri-content')).keys()).length : 0;
      const ph = 'caches' in self ? (await (await caches.open('twagri-photos')).keys()).length : 0;
      const est = await navigator.storage?.estimate?.();
      const mb = est?.usage ? Math.round(est.usage / 1048576) : null;
      status.textContent = tr('offlineStatus', { n: Math.min(n, DATA.halls.length), t: DATA.halls.length, p: ph })
        + (mb != null ? ' · ' + tr('storageUsed', { mb }) : '');
    } catch { status.textContent = ''; }
  })();
  return el('section', { class: 'panel' }, el('h3', {}, tr('offlineTitle')), status, allPhotosControl(), el('p', { class: 'fine' }, tr('offline')));
}

/* ---------- All photos ---------- */

const fmt = n => Number(n).toLocaleString('en-US');
const mbOf = bytes => fmt(Math.round(bytes / 1e6));

// Settings: start, pause or continue downloading every photo.
function allPhotosControl() {
  const box = el('div', { class: 'photo-save' });
  const draw = st => {
    if (!box.isConnected && box.dataset.drawn) { allPhotos.listeners.delete(draw); return; }
    box.dataset.drawn = '1';
    const line = st.running ? tr('allProgress', { n: fmt(st.done), t: fmt(st.total) })
      : st.finished ? tr('allDone')
        : st.total ? tr('allPartly', { n: fmt(st.done), t: fmt(st.total) }) : '';
    const btn = st.running
      ? el('button', { type: 'button', class: 'button', onclick: () => allPhotos.pause() }, tr('pause'))
      : st.finished ? null
        : el('button', { type: 'button', class: 'button', onclick: () => allPhotos.start() },
          st.total ? tr('resume') : tr('allButton', { mb: st.bytes ? mbOf(st.bytes) : '…' }));
    box.replaceChildren(...[btn, line && el('span', { class: 'fine', role: 'status' }, line)].filter(Boolean));
  };
  allPhotos.listeners.add(draw);
  draw(allPhotos.state);
  allPhotos.load().then(() => draw(allPhotos.state)).catch(() => {});
  return box;
}

// A thin progress strip under the top bar, on every page, while photos download.
function photoStrip() {
  const bar = document.querySelector('.topbar');
  let strip = null, hide = null;
  allPhotos.listeners.add(st => {
    if (!st.running && !st.finished) { strip?.remove(); strip = null; return; }
    if (!strip) { strip = el('div', { class: 'dl-strip', role: 'status' }); bar.append(strip); }
    clearTimeout(hide);
    const pct = st.total ? (100 * st.done / st.total).toFixed(1) : 0;
    strip.style.setProperty('--pct', pct + '%');
    strip.replaceChildren(
      el('span', {}, st.running ? tr('allProgress', { n: fmt(st.done), t: fmt(st.total) }) : tr('allDone')),
      st.running ? el('button', { type: 'button', onclick: () => allPhotos.pause() }, tr('pause')) : null);
    if (!st.running) hide = setTimeout(() => { strip?.remove(); strip = null; }, 4000);
  });
}

// Asked once, after any "what's new" sheet has been closed.
async function askAllPhotos() {
  if (allPhotos.asked() || allPhotos.wanted()) return;
  let list;
  try { list = await allPhotos.load(); } catch { return; }
  while (document.querySelector('.wn-scrim')) await new Promise(r => setTimeout(r, 500));
  if (allPhotos.asked()) return;
  const close = () => { allPhotos.markAsked(); scrim.remove(); };
  const scrim = el('div', { class: 'ask-scrim' },
    el('div', { class: 'ask-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ask-title' },
      el('h2', { id: 'ask-title' }, tr('allAskTitle')),
      el('p', {}, tr('allAskBody', { n: fmt(list.keys.length), mb: mbOf(list.bytes) })),
      el('div', { class: 'ask-actions' },
        el('button', { type: 'button', class: 'button primary', onclick: () => { close(); allPhotos.start(); } }, tr('allYes')),
        el('button', { type: 'button', class: 'button', onclick: close }, tr('allNo')))));
  document.body.append(scrim);
}

function renderSettings() {
  const p = prefs.get();
  const share = el('div', { class: 'share' });
  const W = window.WhatsNew;
  main.replaceChildren(el('div', { class: 'settings' },
    el('a', { class: 'back', href: '#/' }, '← ', tr('back')),
    el('h2', {}, tr('settings')),

    el('section', { class: 'panel' },
      el('h3', {}, tr('language')),
      seg(prefs.LANGS.map(l => [l, LANG_NAMES[l]]), p.lang, l => prefs.set({ lang: l }), tr('language'))),

    el('section', { class: 'panel' },
      el('h3', {}, tr('appearance')),
      el('p', { class: 'label' }, tr('mode')),
      seg(prefs.MODES.map(m => [m, tr(m)]), p.mode, m => prefs.set({ mode: m }), tr('mode')),
      el('p', { class: 'fine' }, tr('autoNote')),
      el('p', { class: 'label' }, tr('lightLooks')),
      swatches(prefs.LIGHT_LOOKS, p.light, 'light', look => prefs.set({ light: look, mode: modeFor('light', p) })),
      el('p', { class: 'label' }, tr('darkLooks')),
      swatches(prefs.DARK_LOOKS, p.dark, 'dark', look => prefs.set({ dark: look, mode: modeFor('dark', p) }))),

    offlinePanel(),

    el('section', { class: 'panel' },
      el('h3', {}, tr('share')),
      el('p', { class: 'fine' }, tr('shareNote')),
      share,
      el('p', { class: 'share-url' }, APP_URL)),

    el('section', { class: 'panel about' },
      el('h3', {}, tr('about')),
      el('dl', {},
        el('dt', {}, tr('version')),
        el('dd', {}, W ? W.label(RELEASES) : `v${VERSION}`, ' · ',
          el('button', { type: 'button', class: 'linkish', onclick: () => W?.history() }, tr('history'))),
        el('dt', {}, tr('dataDate')),
        el('dd', {}, DATA.fetched),
        el('dt', {}, tr('source')),
        el('dd', {}, el('a', { href: MOA_LIST, target: '_blank', rel: 'noopener' }, 'kmweb.moa.gov.tw'))),
      el('p', { class: 'fine' }, tr('credit')))));
  renderShare(share, { url: APP_URL, tr, appName: tr('appName') });
}

/* ---------- Updates ---------- */

// Fetch the new service worker, wait until it controls the page, then reload.
/* "Update now": fetch the new version and load it once its worker has taken
   over. Installing takes as long as the 6 MB app takes to download, so wait for
   it (up to a minute) instead of reloading into the old version. */
function applyUpdate() {
  const go = () => location.reload();
  const sw = navigator.serviceWorker;
  if (!sw) return go();
  const timer = setTimeout(go, 60000);
  sw.addEventListener('controllerchange', () => { clearTimeout(timer); go(); }, { once: true });
  sw.getRegistration().then(async reg => {
    if (!reg) return go();
    await reg.update().catch(() => {});
    if (!reg.installing && !reg.waiting) { clearTimeout(timer); go(); }
  }).catch(go);
}

function setupUpdates(firstVisit) {
  const W = window.WhatsNew;
  if (W) {
    W.init({
      version: VERSION, releases: RELEASES, key: `${PREFIX}.seenVersion`,
      lang: () => (lang() === 'zhs' ? 'zh' : lang()), isNewUser: () => firstVisit,
    });
    W.watch({ apply: applyUpdate });
  }
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // A new build took over in the background: offer the reload, never force it.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) W?.offerUpdate(() => location.reload());
  });
}

/* ---------- Start ---------- */

async function start() {
  const p = prefs.init();
  const firstVisit = !p.visited;
  if (firstVisit) prefs.set({ visited: true });
  prefs.applyToDocument();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => prefs.applyToDocument());
  prefs.onChange(() => { prefs.applyToDocument(); render(); });
  addEventListener('hashchange', render);
  render();
  try {
    DATA = await (await fetch('data/halls.json')).json();
    fetch('data/sci.json').then(r => r.json()).then(lex => { setLexicon(lex); render(); }).catch(() => {});
  } catch {
    main.replaceChildren(el('p', { class: 'loading' }, 'Could not load data. Check your connection and reload.'));
    return;
  }
  render();
  setupUpdates(firstVisit);
  photoStrip();
  // Hall text first (37 MB, small next to photos), then photos if the reader asked for them.
  setTimeout(async () => {
    await syncHalls(DATA.halls.map(h => h.id));
    if (allPhotos.wanted()) allPhotos.start();
  }, 2000);
  setTimeout(askAllPhotos, 4000);
}

start();
