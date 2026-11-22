/* Full-text search, off the main thread so typing stays smooth.

   On the first search it reads every hall file (the service worker serves
   them from the offline cache) and keeps the plain text in memory for the
   rest of the visit. Messages in: { id, q, halls: [hall ids], base, skip }.
   Out: { type: 'progress', done, total } while reading, then
   { type: 'results', id, total, results }. */

import { makeDoc, searchDocs } from './fulltext.js';

const docs = [];
let ready = null;

async function build(halls, base) {
  let done = 0;
  for (const id of halls) {
    try {
      const r = await fetch(`${base}data/h/${id}.json`);
      if (r.ok) {
        const hall = await r.json();
        for (const [aid, art] of Object.entries(hall.articles)) docs.push(makeDoc(id, Number(aid), art));
      }
    } catch { /* offline and never stored: that hall is left out of this visit's search */ }
    postMessage({ type: 'progress', done: ++done, total: halls.length });
  }
}

let latest = 0;
onmessage = async ({ data }) => {
  latest = data.id;
  ready ??= build(data.halls, data.base);
  await ready;
  if (data.id !== latest) return;  // a newer query arrived while reading
  postMessage({ type: 'results', id: data.id, ...searchDocs(docs, data.q, { skip: new Set(data.skip || []) }) });
};
