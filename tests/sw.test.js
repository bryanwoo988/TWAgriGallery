/* The service worker: its precache list is current, it caches only this app's
   own files, and on activate it deletes only its own old caches. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { plan, currentBlock, ROOT } from '../tools/build-sw.mjs';
import { join } from 'node:path';

test('sw.js precache block is current (run node tools/build-sw.mjs)', () => {
  const p = plan();
  assert.ok(p.ok, `precache ${p.bytes} bytes is over budget`);
  assert.equal(currentBlock(), p.block);
});

test('precache includes the shell, the data and every hall picture', () => {
  const { files } = plan();
  for (const f of ['index.html', 'manifest.webmanifest', 'js/app.js', 'js/whatsnew.js', 'css/app.css', 'data/halls.json', 'img/covers/19.webp', 'img/icons/19.svg']) {
    assert.ok(files.includes(f), f);
  }
});

function load() {
  const listeners = {};
  const store = new Map([['twagri-old', 1], ['bible-abc', 1], ['pphys-1', 1]]);
  const scope = {
    location: new URL('https://bryanwoo988.github.io/TWAgriGallery/sw.js'),
    caches: {
      keys: async () => [...store.keys()],
      delete: async n => store.delete(n),
      open: async n => { store.set(n, 1); return { add: async () => {}, match: async () => undefined }; },
    },
    clients: { claim: async () => {} }, skipWaiting: async () => {},
    addEventListener: (t, fn) => { listeners[t] = fn; },
    Request: class { constructor(u) { this.url = u; } }, Response: class {}, URL, console, Promise,
  };
  scope.self = scope;
  vm.runInNewContext(readFileSync(join(ROOT, 'sw.js'), 'utf8'), scope);
  return { listeners, store, scope };
}

test('activate removes only this app\'s old caches', async () => {
  const { listeners, store } = load();
  let wait;
  listeners.activate({ waitUntil: p => { wait = p; } });
  await wait;
  assert.ok(!store.has('twagri-old'));
  assert.ok(store.has('bible-abc') && store.has('pphys-1'), 'touched another app\'s cache');
});

test('links to MOA and other sites are left to the network', () => {
  const { listeners } = load();
  let answered = false;
  for (const url of ['https://kmweb.moa.gov.tw/subject/index.php?id=19', 'https://www.tndais.gov.tw/']) {
    listeners.fetch({ request: { url, method: 'GET', mode: 'navigate' }, respondWith: () => { answered = true; } });
  }
  assert.equal(answered, false);
});
