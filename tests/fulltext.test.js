/* Full-text search: 繁/简 both match, every term must match, title hits first,
   and the snippet is cut from the original text at the right place. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, makeDoc, searchDocs, plainText } from '../js/fulltext.js';

const docs = [
  makeDoc(1, 10, { t: '芒果施肥', body: '<p>芒果在開花前施肥。</p>' }),
  makeDoc(1, 11, { t: '炭疽病', body: '<p>炭疽病是芒果最嚴重的病害，<i>Colletotrichum</i> 引起。施肥要注意。</p>', answers: [{ body: '<p>專家說：噴藥防治炭疽病。</p>' }] }),
  makeDoc(2, 20, { t: '水稻', body: '<p>水稻栽培與灌溉&amp;排水。</p>' }),
];

test('folding keeps positions: same length as the original', () => {
  const s = '臺灣農業發展與Rhizoctonia病害';
  assert.equal(fold(s).length, s.length);
  assert.equal(fold('發展'), fold('发展'));
});

test('简体 and 繁體 queries find the same articles', () => {
  const a = searchDocs(docs, '炭疽病').results.map(r => r.a);
  const b = searchDocs(docs, '炭疽病').results.map(r => r.a);
  assert.deepEqual(a, b);
  assert.deepEqual(searchDocs(docs, '严重').results.map(r => r.a), [11]);
  assert.deepEqual(searchDocs(docs, 'colletotrichum').results.map(r => r.a), [11]);
});

test('every term must match; title matches come first', () => {
  assert.deepEqual(searchDocs(docs, '施肥').results.map(r => r.a), [10, 11]);
  assert.deepEqual(searchDocs(docs, '施肥 炭疽病').results.map(r => r.a), [11]);
  assert.equal(searchDocs(docs, '施肥 水稻').total, 0);
});

test('expert replies are searched; one-character queries are not', () => {
  assert.deepEqual(searchDocs(docs, '噴藥').results.map(r => r.a), [11]);
  assert.equal(searchDocs(docs, '病').total, 0);
});

test('snippet shows the match in the original text', () => {
  const [r] = searchDocs(docs, '严重').results;
  assert.equal(r.snip[1], '嚴重');
  assert.ok(r.snip[0].endsWith('芒果最'));
  assert.equal(plainText({ body: '<p>灌溉&amp;排水</p>' }), '灌溉&排水');
});

test('articles already shown as title results can be skipped', () => {
  assert.deepEqual(searchDocs(docs, '施肥', { skip: new Set(['1/10']) }).results.map(r => r.a), [11]);
});
