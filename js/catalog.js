/* The hall catalogue: picking text by language, searching and sorting.
   Pure functions, no DOM, so tests can run them directly. */

// Hall text is { zht, zhs, en, ms }. Section titles exist only in Chinese.
export function text(obj, lang) {
  if (!obj) return '';
  return obj[lang] || obj.en || obj.zht || '';
}

export function sectionText(obj, lang) {
  return (lang === 'zhs' ? obj.zhs : obj.zht) || obj.zht || '';
}

// The name shown under the main one: the MOA original for en/ms readers,
// the English name for Chinese readers.
export function altName(hall, lang) {
  return lang === 'en' || lang === 'ms' ? hall.name.zht : hall.name.en;
}

const COLLATOR = {
  en: 'en', ms: 'ms', zht: 'zh-Hant-TW-u-co-stroke', zhs: 'zh-Hans-u-co-pinyin',
};

export function sortHalls(halls, lang) {
  let coll;
  try { coll = new Intl.Collator(COLLATOR[lang] || 'en'); } catch { coll = new Intl.Collator('en'); }
  return [...halls].sort((a, b) => coll.compare(text(a.name, lang), text(b.name, lang)));
}

export const norm = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

/* Everything a reader might type to find a hall: its name and summary in
   every language, the agency, and every section title. */
export function haystack(hall) {
  const parts = [];
  for (const k of ['name', 'intro', 'agency']) parts.push(...Object.values(hall[k] || {}));
  for (const g of hall.groups || []) {
    parts.push(g.zht, g.zhs);
    for (const i of g.items) parts.push(i.zht, i.zhs);
  }
  return norm(parts.join(' \n '));
}

// Names count more than summaries: a hall named "Banana" comes before one
// that merely mentions bananas.
export function score(hall, q, hay = haystack(hall)) {
  const terms = norm(q).split(' ').filter(Boolean);
  if (!terms.length) return 1;
  const names = norm(Object.values(hall.name).join(' '));
  let s = 0;
  for (const term of terms) {
    if (!hay.includes(term)) return 0;
    s += names.includes(term) ? 10 : 1;
  }
  return s;
}

export function filterHalls(halls, { cat = '', q = '', lang = 'en' } = {}, hays = new Map()) {
  const pool = cat ? halls.filter(h => h.cats.includes(cat)) : halls;
  const sorted = sortHalls(pool, lang);
  if (!norm(q)) return sorted;
  const hay = h => { if (!hays.has(h.id)) hays.set(h.id, haystack(h)); return hays.get(h.id); };
  return sorted
    .map(h => [score(h, q, hay(h)), h])
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([, h]) => h);
}

export function countByCat(halls) {
  const n = {};
  for (const h of halls) for (const c of h.cats) n[c] = (n[c] || 0) + 1;
  return n;
}
