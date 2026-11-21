/* The service worker: its lists are current, it routes each kind of file to
   the right cache, updates article text hall by hall, and only ever deletes
   its own caches. Runs the real sw.js against fake Cache Storage. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { join } from 'node:path';
import { plan, currentBlock, ROOT } from '../tools/build-sw.mjs';

const ORIGIN = 'https://bryanwoo988.github.io';
const BASE = `${ORIGIN}/TWAgriGallery/`;

test('sw.js lists are current (run node tools/build-sw.mjs)', () => {
  const p = plan();
  assert.ok(p.ok, `shell ${p.bytes} bytes is over budget`);
  assert.equal(currentBlock(), p.block);
});

test('the shell holds the app; hall text and article photos are not in it', () => {
  const { files, content } = plan();
  for (const f of ['index.html', 'manifest.webmanifest', 'js/app.js', 'js/t2s-data.js', 'js/whatsnew.js', 'css/app.css', 'data/halls.json', 'img/covers/19.webp', 'img/icons/19.svg']) {
    assert.ok(files.includes(f), f);
  }
  assert.ok(!files.some(f => f.startsWith('data/h/') || f.startsWith('img/p/')));
  assert.ok(content.every(f => /^data\/h\/\d+\.json$/.test(f)));
});

class Res {
  constructor(body, status = 200) { this.body = body; this.status = status; }
  get ok() { return this.status >= 200 && this.status < 300; }
  clone() { return new Res(this.body, this.status); }
}

function load(content = { 'data/h/19.json': 'v2' }, existing = {}) {
  const listeners = {};
  const stores = new Map();
  const net = [];
  const cacheFor = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    const key = r => (typeof r === 'string' ? new URL(r, BASE).href : r.url);
    return {
      add: async r => { m.set(key(r), new Res('shell')); },
      put: async (r, res) => { m.set(key(r), res); },
      match: async (r, o) => {
        const k = key(r);
        if (m.has(k)) return m.get(k);
        if (o?.ignoreSearch) for (const [kk, v] of m) if (kk.split('?')[0] === k.split('?')[0]) return v;
      },
      keys: async () => [...m.keys()].map(url => ({ url })),
      delete: async r => m.delete(key(r)),
    };
  };
  for (const [name, entries] of Object.entries(existing)) {
    const c = cacheFor(name);
    for (const url of entries) c.put(url, new Res('old'));
  }
  const scope = {
    location: new URL(BASE + 'sw.js'),
    caches: {
      keys: async () => [...stores.keys()],
      delete: async n => stores.delete(n),
      open: async n => cacheFor(n),
    },
    fetch: async r => { const url = typeof r === 'string' ? r : r.url; net.push(url); return new Res('net:' + url); },
    clients: { claim: async () => {} }, skipWaiting: async () => {},
    addEventListener: (t, fn) => { listeners[t] = fn; },
    Request: class { constructor(u) { this.url = new URL(u, BASE).href; } }, Response: Res, URL, console, Promise, Object, Set,
  };
  scope.self = scope;
  // The real worker with a small generated block, so the test controls the lists.
  const src = readFileSync(join(ROOT, 'sw.js'), 'utf8').replace(
    /\/\* --- generated:begin --- \*\/[\s\S]*?\/\* --- generated:end --- \*\//,
    `const CACHE = 'twagri-new'; const SHELL_ASSETS = ['./', 'index.html']; const CONTENT = ${JSON.stringify(content)};`);
  vm.runInNewContext(src, scope);
  const run = async (type, ev = {}) => { let w; listeners[type]({ ...ev, waitUntil: p => { w = p; } }); await w; };
  const respond = async (url, mode = 'no-cors') => {
    let p = null;
    listeners.fetch({ request: { url, method: 'GET', mode }, respondWith: x => { p = x; } });
    return p ? await p : null;
  };
  return { stores, net, run, respond };
}

test('install fetches only halls whose version changed', async () => {
  const sw = load({ 'data/h/19.json': 'v2', 'data/h/20.json': 'v1' },
    { 'twagri-content': [`${BASE}data/h/19.json?v=v1`, `${BASE}data/h/20.json?v=v1`] });
  await sw.run('install');
  assert.deepEqual(sw.net.filter(u => u.includes('data/h/')), [`${BASE}data/h/19.json?v=v2`]);
});

test('activate drops old versions and other old shells, never another app\'s caches', async () => {
  const sw = load({ 'data/h/19.json': 'v2' }, {
    'twagri-old': ['index.html'], 'bible-abc': ['x'], 'twagri-photos': [`${BASE}img/p/abc.webp`],
    'twagri-content': [`${BASE}data/h/19.json?v=v1`, `${BASE}data/h/19.json?v=v2`, `${BASE}data/h/99.json?v=v1`],
  });
  await sw.run('activate');
  assert.ok(!sw.stores.has('twagri-old'));
  assert.ok(sw.stores.has('bible-abc'), 'deleted another app\'s cache');
  assert.ok(sw.stores.has('twagri-photos'), 'saved photos must survive a release');
  assert.deepEqual([...sw.stores.get('twagri-content').keys()], [`${BASE}data/h/19.json?v=v2`]);
});

test('an old hall version is kept until the new one has arrived', async () => {
  const sw = load({ 'data/h/19.json': 'v2' }, { 'twagri-content': [`${BASE}data/h/19.json?v=v1`] });
  await sw.run('activate');
  assert.deepEqual([...sw.stores.get('twagri-content').keys()], [`${BASE}data/h/19.json?v=v1`]);
});

test('hall text is served from the content cache; photos are kept once fetched', async () => {
  const sw = load({ 'data/h/19.json': 'v2' }, { 'twagri-content': [`${BASE}data/h/19.json?v=v2`] });
  assert.equal((await sw.respond(`${BASE}data/h/19.json`)).body, 'old');
  assert.equal(sw.net.length, 0);
  await sw.respond(`${BASE}img/p/abc123.webp`);
  assert.ok(sw.stores.get('twagri-photos').has(`${BASE}img/p/abc123.webp`));
  await sw.respond(`${BASE}img/p/abc123.webp`);
  assert.equal(sw.net.filter(u => u.includes('abc123')).length, 1, 'second view came from the network');
});

test('links to MOA and other sites are left to the network', async () => {
  const sw = load();
  for (const url of ['https://kmweb.moa.gov.tw/subject/index.php?id=19', 'https://www.tndais.gov.tw/']) {
    assert.equal(await sw.respond(url, 'navigate'), null);
  }
});
