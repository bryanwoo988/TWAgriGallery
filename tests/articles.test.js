/* The article data: every hall has its file, every listed article exists,
   the HTML holds only the safe tags, and every photo it names is on disk. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { halls } = JSON.parse(readFileSync(join(ROOT, 'data/halls.json'), 'utf8'));
const load = id => JSON.parse(readFileSync(join(ROOT, `data/h/${id}.json`), 'utf8'));
const photos = new Set(existsSync(join(ROOT, 'img/p')) ? readdirSync(join(ROOT, 'img/p')).map(f => f.replace(/\.webp$/, '')) : []);
const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'sup', 'sub', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'img', 'figure', 'figcaption', 'hr']);

test('every hall has an article file', () => {
  for (const h of halls) assert.ok(existsSync(join(ROOT, `data/h/${h.id}.json`)), String(h.id));
});

test('sections point at articles that exist', () => {
  for (const h of halls) {
    const d = load(h.id);
    for (const s of d.sections) {
      assert.ok(['list', 'link', 'empty'].includes(s.kind), `${h.id}/${s.id} kind ${s.kind}`);
      for (const a of s.a) assert.ok(d.articles[a], `${h.id}/${s.id} -> ${a}`);
    }
  }
});

function checkHtml(html, where) {
  for (const [, tag, attrs] of html.matchAll(/<([a-z0-9]+)([^>]*)>/g)) {
    assert.ok(ALLOWED.has(tag), `${where}: <${tag}>`);
    for (const [, name] of attrs.matchAll(/\s([\w-]+)=/g)) {
      assert.ok(['href', 'target', 'rel', 'data-p', 'alt', 'colspan', 'rowspan'].includes(name), `${where}: ${tag} ${name}`);
    }
    if (tag === 'a' && /href=/.test(attrs)) assert.match(attrs, /href="https?:\/\//, where);
  }
  assert.ok(!/javascript:|on\w+=/i.test(html.replace(/>[^<]*</g, '><')), `${where}: script in markup`);
}

test('article HTML holds only safe tags, and every photo it names ships', () => {
  let n = 0;
  for (const h of halls) {
    for (const [id, a] of Object.entries(load(h.id).articles)) {
      const where = `${h.id}/${id}`;
      assert.ok(a.t, `${where} title`);
      for (const body of [a.body, ...(a.answers || []).map(x => x.body)]) {
        checkHtml(body, where);
        for (const [, k] of body.matchAll(/data-p="(\w+)"/g)) assert.ok(photos.has(k), `${where} photo ${k}`);
      }
      for (const g of a.gallery) assert.ok(photos.has(g.p), `${where} gallery ${g.p}`);
      for (const f of [...a.files, ...(a.answers || []).flatMap(x => x.files)]) assert.match(f.u, /^https?:\/\//, where);
      if (a.pub) assert.match(a.pub, /^\d{4}-\d{2}-\d{2}$/, where);
      n++;
    }
  }
  assert.ok(n > 0);
});

test('the search index lists every article once, in its own hall', () => {
  const index = JSON.parse(readFileSync(join(ROOT, 'data/index.json'), 'utf8'));
  const seen = new Set();
  const files = new Map(halls.map(h => [h.id, load(h.id)]));
  for (const [aid, hid, , title] of index) {
    assert.ok(files.get(hid)?.articles[aid], `${hid}/${aid}`);
    assert.equal(files.get(hid).articles[aid].t, title);
    seen.add(`${hid}/${aid}`);
  }
  const total = [...files.values()].reduce((n, d) => n + Object.keys(d.articles).length, 0);
  assert.equal(seen.size, total);
});
