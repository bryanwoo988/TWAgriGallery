/* 繁體 → 简体, the same tables as OpenCC t2s: the longest known phrase first,
   then character by character. Article text ships in 繁體 only. */
import { CHARS, PHRASES } from './t2s-data.js';

const MAXLEN = Math.max(...Object.keys(PHRASES).map(k => [...k].length));

export function t2s(text) {
  const s = [...String(text ?? '')];
  let out = '';
  for (let i = 0; i < s.length;) {
    let hit = false;
    for (let n = Math.min(MAXLEN, s.length - i); n >= 2; n--) {
      const w = s.slice(i, i + n).join('');
      if (PHRASES[w]) { out += PHRASES[w]; i += n; hit = true; break; }
    }
    if (!hit) { out += CHARS[s[i]] ?? s[i]; i++; }
  }
  return out;
}
