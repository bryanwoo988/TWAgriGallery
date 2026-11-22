# Release rule

Every change that ships to users adds an entry at the top of `RELEASES` in `js/releases.js`:
the new version number, the day in Malaysia (`date`, UTC+8), the moment it goes live in UTC
(`at`, `date -u +%Y-%m-%dT%H:%M:00Z`), and what changed in plain words in en, zh (简体), zht (繁體) and ms.
Bug fixes bump the last digit, new features the middle one.

Shared standard for all of Bryan Woo's apps:
https://github.com/bryanwoo988/woobrothers.my/blob/main/APP-STANDARDS.md

# Shipping

- The owner has authorized Claude to merge its own pull requests into main without asking,
  after `npm test` passes and a browser check. Say what went live and link the PR.
- `.github/workflows/refresh.yml` refreshes articles monthly and commits to main by itself
  (new articles only; `tools/add_release.py` writes the release entry). It must keep working:
  run it by hand after changing tools/crawl.py or tools/build_articles.py.

# Before committing

- `node tools/build-sw.mjs` then `npm test` (the sw test fails if the precache list is stale).
- Default language stays English. Every interface string needs en, zht, zhs, ms (`tests/i18n.test.js`).

# Content rules

- 繁體 text is MOA's own, unchanged. 简体 is OpenCC t2s of it; do not hand-edit data/halls.json.
- English/Malay summaries in `tools/content/translations.py` restate only facts in that hall's MOA overview.
  No added facts, no health claims beyond what MOA states, and keep MOA's disclaimers (e.g. roselle, herbs).
- Article text is MOA's, unchanged apart from the tag whitelist in tools/build_articles.py; do not hand-edit data/h/.
  News reprints (新鮮聞), member comments, votes and askers' names stay out; those link to kmweb.moa.gov.tw.
- Scientific names are italicized in the app (js/sciname.js), not in the data: only genera MOA itself writes
  as scientific names (data/sci.json, built by tools/build_articles.py).
- Images come from MOA (used with permission) and are credited in Settings → About.
- Cache names and storage keys start with `twagri`.
