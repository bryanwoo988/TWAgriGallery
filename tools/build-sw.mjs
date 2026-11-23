/* Regenerate the service worker's precache list and cache name.

     node tools/build-sw.mjs

   The name is a hash of every precached file's path and contents, so any
   change ships to installed copies with nothing to remember. CI runs this on
   every push and fails when the precache would exceed BUDGET: everything is
   downloaded on install. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

// The shell: everything except per-hall article files (CONTENT) and article photos.
const DIRS = ['css', 'js', 'data', 'icons', 'img/covers', 'img/icons'];
const IS_CONTENT = f => /^data\/h\/\d+\.json$/.test(f);
const FILES = ['index.html', 'manifest.webmanifest', 'favicon.ico'];
const SKIP = /(^\.|\.DS_Store$|~$)/;
export const BUDGET = 12 * 1048576;
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOCK = /\/\* --- generated:begin --- \*\/[\s\S]*?\/\* --- generated:end --- \*\//;

function walk(root, dir, out = []) {
  for (const name of readdirSync(join(root, dir)).sort()) {
    if (SKIP.test(name)) continue;
    const rel = posix.join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) walk(root, rel, out);
    else out.push(rel);
  }
  return out;
}

// What the generated block should say, without writing anything.
export function plan(root = ROOT) {
  const all = [
    ...FILES.filter(f => existsSync(join(root, f))),
    ...DIRS.filter(d => existsSync(join(root, d))).flatMap(d => walk(root, d)),
  ].filter(f => !f.startsWith('icons/splash/')).sort();  // iOS launch images: fetched once, at "Add to Home Screen"

  const files = all.filter(f => !IS_CONTENT(f));
  const content = all.filter(IS_CONTENT);
  const hash = createHash('sha256');
  for (const f of files) { hash.update(f); hash.update(readFileSync(join(root, f))); }
  const cache = `twagri-${hash.digest('hex').slice(0, 10)}`;
  const versions = Object.fromEntries(content.map(f => [f, createHash('sha256').update(readFileSync(join(root, f))).digest('hex').slice(0, 10)]));
  const bytes = files.reduce((a, f) => a + statSync(join(root, f)).size, 0);
  const contentBytes = content.reduce((a, f) => a + statSync(join(root, f)).size, 0);
  const block = [
    '/* --- generated:begin --- */',
    `const CACHE = '${cache}';`,
    'const SHELL_ASSETS = [',
    "  './',",
    ...files.map(f => `  '${f}',`),
    '];',
    'const CONTENT = {',
    ...content.map(f => `  '${f}': '${versions[f]}',`),
    '};',
    '/* --- generated:end --- */',
  ].join('\n');
  return { files, content, bytes, contentBytes, cache, block, ok: bytes <= BUDGET };
}

export function currentBlock(root = ROOT) {
  return readFileSync(join(root, 'sw.js'), 'utf8').match(BLOCK)?.[0] ?? null;
}

export function build(root = ROOT) {
  const p = plan(root);
  if (!p.ok) return p;
  const path = join(root, 'sw.js');
  const sw = readFileSync(path, 'utf8');
  if (!BLOCK.test(sw)) throw new Error('sw.js has no generated block');
  writeFileSync(path, sw.replace(BLOCK, p.block));
  return p;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = build();
  console.log(`shell:    ${r.files.length} files, ${(r.bytes / 1048576).toFixed(2)} MB (budget ${BUDGET / 1048576} MB)`);
  console.log(`content:  ${r.content.length} hall files, ${(r.contentBytes / 1048576).toFixed(2)} MB`);
  if (!r.ok) { console.error('precache over budget'); process.exit(1); }
  console.log(`cache:    ${r.cache}`);
}
