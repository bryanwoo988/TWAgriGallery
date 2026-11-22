/* Scientific names in italics.

   MOA writes many binomials in plain text. A "Genus species" is italicized only
   when the genus is one MOA itself writes as a scientific name elsewhere
   (data/sci.json, from tools/build_articles.py), the second word reads as a
   Latin epithet (or is sp./spp.), and it stands in Chinese text rather than
   inside an English sentence. "C. japonica" needs a known epithet. Authors
   (L., Thunb.) and var./subsp. stay upright; the variety name is italic. */

let G = new Set(), E = new Set();

export function setLexicon(lex) {
  G = new Set(lex?.genera || []);
  E = new Set(lex?.epithets || []);
}

const EPITHET = /^[a-z]{2,}(?:a|ae|i|is|us|um|ax|ex|ix|or|ans|ens|ys|os|ense|ale|are|ile|ere|oides)$/;
const RANK = '(?:var\\.|subsp\\.|ssp\\.|f\\.)';
const NAME = new RegExp(
  `(?<![A-Za-z])([A-Z][a-z]{2,}|[A-Z]\\.)[ \\u00a0]+(spp?\\.|[a-z]{3,})(?:[ \\u00a0]+(${RANK})[ \\u00a0]+([a-z]{3,}))?(?![A-Za-z])`, 'g');
const ENGLISH_NEXT = /^\s*(?:and|or|of|the|in|is|are|was|were|with|for|to|on|by|from|at|as|that|which)\b/;

function isName(text, m) {
  const [, genus, epi] = m;
  const known = genus.length === 2 ? E.has(epi) : G.has(genus) && (/^spp?\.$/.test(epi) || EPITHET.test(epi) || E.has(epi));
  if (!known) return false;
  const before = text.slice(0, m.index).trimEnd().slice(-1);
  if (/[A-Za-z0-9,]/.test(before)) return false;  // part of an English sentence or list
  return !ENGLISH_NEXT.test(text.slice(m.index + m[0].length));
}

/* Text -> [[piece, italic?], ...]; plain text comes back as one upright piece. */
export function splitNames(text) {
  const out = [];
  let at = 0;
  if (!G.size || !text) return [[text || '', false]];
  for (const m of text.matchAll(NAME)) {
    if (!isName(text, m)) continue;
    const [all, genus, epi, rank, infra] = m;
    if (m.index > at) out.push([text.slice(at, m.index), false]);
    const sep1 = all.slice(genus.length, all.indexOf(epi, genus.length));
    if (/^spp?\.$/.test(epi)) {
      out.push([genus, true], [sep1 + epi, false]);
    } else if (rank) {
      const head = all.slice(0, all.lastIndexOf(rank));
      out.push([head.trimEnd(), true], [all.slice(head.trimEnd().length, all.lastIndexOf(infra)), false], [infra, true]);
    } else {
      out.push([all, true]);
    }
    at = m.index + all.length;
  }
  if (at < text.length) out.push([text.slice(at), false]);
  return out.length ? out : [[text, false]];
}

/* For el(): strings and <i> elements. */
export function sciNodes(text) {
  const parts = splitNames(text);
  if (parts.length === 1 && !parts[0][1]) return parts[0][0];
  return parts.map(([s, i]) => {
    if (!i) return s;
    const n = document.createElement('i');
    n.className = 'sci';
    n.textContent = s;
    return n;
  });
}

/* Italicize names in a parsed fragment, leaving text already in <i>/<em> alone. */
export function italicizeIn(root) {
  if (!G.size) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const todo = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement?.closest('i, em')) continue;
    if (/[A-Z]/.test(n.nodeValue)) todo.push(n);
  }
  for (const n of todo) {
    const parts = splitNames(n.nodeValue);
    if (parts.length === 1 && !parts[0][1]) continue;
    n.replaceWith(...parts.map(([s, i]) => {
      if (!i) return document.createTextNode(s);
      const e = document.createElement('i');
      e.className = 'sci';
      e.textContent = s;
      return e;
    }));
  }
}
