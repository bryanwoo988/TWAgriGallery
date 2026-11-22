/* Scientific names: which plain "Genus species" get italics, and which do not. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setLexicon, splitNames } from '../js/sciname.js';

setLexicon(JSON.parse(readFileSync(new URL('../data/sci.json', import.meta.url), 'utf8')));
const italic = s => splitNames(s).filter(([, i]) => i).map(([p]) => p);

test('binomials in Chinese text are italic, authors stay upright', () => {
  assert.deepEqual(italic('立枯病由Rhizoctonia solani引起'), ['Rhizoctonia solani']);
  assert.deepEqual(italic('落花生(Arachis hypogaea L.)開花後'), ['Arachis hypogaea']);
  assert.deepEqual(italic('大蒜 Allium sativum L. 為'), ['Allium sativum']);
});

test('sp./spp. italicize the genus only; var. stays upright, the variety is italic', () => {
  assert.deepEqual(italic('炭疽病菌(Colletotrichum spp.)'), ['Colletotrichum']);
  const parts = splitNames('（Citrus reticulata var. tankan）');
  assert.deepEqual(parts.filter(([, i]) => i).map(([p]) => p), ['Citrus reticulata', 'tankan']);
  assert.equal(parts.map(([p]) => p).join(''), '（Citrus reticulata var. tankan）');
});

test('abbreviated genus needs a known epithet', () => {
  assert.deepEqual(italic('其中 R. solani 最常見'), ['R. solani']);
  assert.deepEqual(italic('其中 H. and 最常見'), []);
});

test('English phrases are left alone', () => {
  for (const s of ['The results were good', 'Grading system', '（Cucumber mosaic virus）', 'Angelica oil 萃取',
    'Phytophthora blight 防治', 'Tidal range', 'Golden fleece', 'Newcastle disease', 'Bacillus thuringiensis and others']) {
    assert.deepEqual(italic(s), [], s);
  }
});

test('text is never lost or reordered', () => {
  const s = '黃金果(Pouteria caimito)與酪梨(Persea americana Mill.)，以及Colletotrichum spp.。';
  assert.equal(splitNames(s).map(([p]) => p).join(''), s);
});
