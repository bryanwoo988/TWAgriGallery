/* Full-text search over article text: the pure part, shared by the search
   worker and the tests.

   Text is MOA's 繁體. A 简体 query must still match, so both sides are
   "folded": each character mapped through OpenCC's t2s character table and
   ASCII lowercased. Only one-to-one mappings of the same length are used, so a
   position in the folded text is the same position in the original, which is
   what the snippet is cut from. */

import { CHARS } from './t2s-data.js';

const MAP = new Map();
for (const [k, v] of Object.entries(CHARS)) if (v.length === k.length) MAP.set(k, v);

export function fold(s) {
  let out = '';
  for (const c of s) out += MAP.get(c) ?? c;
  return out.replace(/[A-Z]+/g, m => m.toLowerCase());
}

const ENTITY = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

// Article -> plain text: body and expert replies, tags dropped, spaces squeezed.
export function plainText(a) {
  return [a.body, ...(a.answers || []).map(x => x.body)].join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITY[e])
    .replace(/\s+/g, ' ').trim();
}

export function makeDoc(h, a, art) {
  const text = plainText(art);
  return { h, a, t: art.t, tf: fold(art.t), text, f: fold(text) };
}

export const terms = q => fold(String(q || '').trim()).split(/\s+/).filter(Boolean);

function count(hay, needle, cap) {
  let n = 0;
  for (let i = hay.indexOf(needle); i !== -1 && n < cap; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
}

/* Articles containing every term (in the text or the title). Title matches
   come first, then the ones that mention the first term most. Each result has
   a snippet around the first mention: [before, match, after]. */
export function searchDocs(docs, q, { max = 100, skip = new Set() } = {}) {
  const ts = terms(q);
  if (!ts.length || ts.join('').length < 2) return { total: 0, results: [] };
  const hits = [];
  for (const d of docs) {
    if (skip.has(`${d.h}/${d.a}`)) continue;
    if (!ts.every(t => d.f.includes(t) || d.tf.includes(t))) continue;
    const inTitle = ts.every(t => d.tf.includes(t));
    hits.push({ d, score: (inTitle ? 1000 : 0) + count(d.f, ts[0], 50) });
  }
  hits.sort((x, y) => y.score - x.score);
  const results = hits.slice(0, max).map(({ d }) => {
    const i = d.f.indexOf(ts[0]);
    const snip = i < 0 ? [d.text.slice(0, 80), '', ''] : [
      (i > 30 ? '…' : '') + d.text.slice(Math.max(0, i - 30), i),
      d.text.slice(i, i + ts[0].length),
      d.text.slice(i + ts[0].length, i + ts[0].length + 60) + (i + ts[0].length + 60 < d.text.length ? '…' : ''),
    ];
    return { h: d.h, a: d.a, t: d.t, snip };
  });
  return { total: hits.length, results };
}
