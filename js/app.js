/* Taiwan Agri Gallery: a catalogue of MOA's 157 theme halls.

   Routes (hash):
     #/          all halls        #/c/B   one category
     #/h/19      one hall         #/settings
   The search text lives in memory, so going back to the list keeps it. */

import * as prefs from './prefs.js';
import { t, LANG_NAMES } from './i18n.js';
import { text, sectionText, altName, filterHalls, countByCat } from './catalog.js';
import { APP_URL, MOA_LIST, hallUrl, sectionUrl, PREFIX } from './config.js';
import { RELEASES, VERSION } from './releases.js';
import { renderShare } from './share.js';

const $ = s => document.querySelector(s);
const main = $('#main');
const CAT_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'];

let DATA = null;
let query = '';
const hays = new Map();
const scrollMemory = new Map();
let lastRoute = '';

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

/* ---------- Shell ---------- */

function renderHeader() {
  $('#app-title').textContent = tr('appName');
  $('#settings-link').setAttribute('aria-label', tr('settings'));
  $('#settings-link').title = tr('settings');
  document.title = tr('appName');
}

function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  const m = h.match(/^\/h\/(\d+)/);
  if (m) return { name: 'hall', id: +m[1] };
  if (h.startsWith('/settings')) return { name: 'settings' };
  const c = h.match(/^\/c\/([A-Z])/);
  return { name: 'list', cat: c && CAT_ORDER.includes(c[1]) ? c[1] : '' };
}

function render() {
  if (lastRoute.startsWith('#/c/') || lastRoute === '#/' || lastRoute === '') scrollMemory.set(lastRoute || '#/', scrollY);
  renderHeader();
  const r = route();
  const key = location.hash || '#/';
  document.body.dataset.view = r.name;
  if (!DATA) { main.replaceChildren(el('p', { class: 'loading' }, '…')); return; }
  if (r.name === 'hall') renderHall(r.id);
  else if (r.name === 'settings') renderSettings();
  else renderList(r.cat);
  const y = r.name === 'list' ? (scrollMemory.get(key) ?? 0) : 0;
  requestAnimationFrame(() => scrollTo(0, y));
  lastRoute = key;
}

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

const iconStyle = id => `-webkit-mask-image:url(img/icons/${id}.svg);mask-image:url(img/icons/${id}.svg)`;

function renderList(cat) {
  const L = lang();
  const counts = countByCat(DATA.halls);
  const chips = el('nav', { class: 'chips', 'aria-label': tr('all') },
    chip(tr('all'), DATA.halls.length, '#/', !cat),
    CAT_ORDER.map(c => chip(text(DATA.categories[c], L), counts[c] || 0, `#/c/${c}`, cat === c)));

  const grid = el('div', { class: 'grid' });
  const status = el('p', { class: 'status', role: 'status' });
  const input = el('input', {
    type: 'search', class: 'search-input', placeholder: tr('search'), 'aria-label': tr('search'),
    value: query, autocomplete: 'off', enterkeyhint: 'search',
  });
  const fill = () => {
    const list = filterHalls(DATA.halls, { cat, q: query, lang: L }, hays);
    grid.replaceChildren(...list.map(card));
    status.textContent = list.length ? tr('results', { n: list.length }) : tr('none', { q: query });
  };
  input.addEventListener('input', () => { query = input.value; fill(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });

  const intro = el('section', { class: 'hero' },
    el('p', { class: 'hero-tag' }, tr('tagline')),
    el('div', { class: 'search' }, el('span', { class: 'search-icon', 'aria-hidden': 'true' }), input));

  main.replaceChildren(intro, chips, status, grid);
  fill();
  // Keep the active category chip in view on narrow screens.
  chips.querySelector('.is-active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ---------- Hall ---------- */

function renderHall(id) {
  const L = lang();
  const h = DATA.halls.find(x => x.id === id);
  if (!h) { location.replace('#/'); return; }
  const ext = { target: '_blank', rel: 'noopener' };

  const groups = h.groups.map(g => {
    const title = sectionText(g, L);
    const head = g.id ? el('a', { href: sectionUrl(g.id), ...ext }, title) : title;
    return el('li', { class: 'group' },
      el('div', { class: 'group-title' }, head),
      g.items.length ? el('ul', { class: 'items' },
        g.items.map(i => el('li', {}, el('a', { href: sectionUrl(i.id), ...ext }, sectionText(i, L))))) : null);
  });

  const note = tr('summaryNote');
  main.replaceChildren(el('article', { class: 'hall' },
    el('a', { class: 'back', href: backHref(h) }, '← ', tr('back')),
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
      el('p', { class: 'intro' }, text(h.intro, L)),
      note ? el('p', { class: 'fine' }, note) : null,
      el('a', { class: 'button primary', href: hallUrl(h.id), ...ext }, tr('openHall'), el('span', { class: 'ext', 'aria-hidden': 'true' }, ' ↗'))),
    groups.length ? el('section', { class: 'panel' },
      el('h3', {}, tr('sections')),
      el('p', { class: 'fine' }, tr('sectionsNote')),
      el('ul', { class: 'groups' }, groups)) : null,
    el('p', { class: 'agency' }, tr('maintainer'), ': ',
      h.agencyUrl ? el('a', { href: h.agencyUrl, ...ext }, text(h.agency, L)) : text(h.agency, L))));
}

// Back to where the reader came from: the category list they were browsing.
function backHref(h) {
  const prev = lastRoute.match(/^#\/c\/[A-Z]$/) ? lastRoute : '#/';
  return prev;
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
      el('p', { class: 'fine' }, tr('credit')),
      el('p', { class: 'fine' }, tr('offline')))));
  renderShare(share, { url: APP_URL, tr, appName: tr('appName') });
}

/* ---------- Updates ---------- */

// Fetch the new service worker, wait until it controls the page, then reload.
function applyUpdate() {
  const go = () => location.reload();
  const sw = navigator.serviceWorker;
  if (!sw) return go();
  const timer = setTimeout(go, 8000);
  sw.addEventListener('controllerchange', () => { clearTimeout(timer); go(); }, { once: true });
  sw.getRegistration().then(reg => (reg ? reg.update() : go())).catch(go);
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
  } catch {
    main.replaceChildren(el('p', { class: 'loading' }, 'Could not load data. Check your connection and reload.'));
    return;
  }
  render();
  setupUpdates(firstVisit);
}

start();
