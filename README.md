# Taiwan Agri Gallery · 臺灣農業主題館

A phone-first PWA catalogue of the 157 theme halls (主題館) on Taiwan's Ministry of
Agriculture Agricultural Knowledge Portal, <https://kmweb.moa.gov.tw/theme_list.php?theme=subject_list_view>.

Each hall shows its picture, an overview, its section menu, and links to the original
MOA hall and section pages. The full articles stay on the MOA site.

- Languages: English (default), 繁體中文, 简体中文, Bahasa Melayu
- 8 appearances: Classic, Paper, Mint, Lavender (light) · Midnight, OLED, Slate, Grape (dark), with Auto
- Works offline after the first visit; QR code and share link in Settings
- Update history with version, date and time; asks before reloading into a new version

Live: <https://bryanwoo988.github.io/TWAgriGallery/>

## Content

Text and images belong to the Ministry of Agriculture, Taiwan, and are used with permission.

| Language | Hall name and overview | Section titles |
|---|---|---|
| 繁體中文 | MOA's text, unchanged | MOA's text |
| 简体中文 | OpenCC `t2s` character conversion of MOA's text (Taiwan terms kept) | same conversion |
| English, Bahasa Melayu | `tools/content/translations.py`: name plus a one- or two-sentence summary of MOA's overview | shown in Chinese (they open Chinese pages) |

## Refreshing the data

```sh
pip install opencc-python-reimplemented pillow
python3 tools/scrape.py --fresh   # MOA pages and images into .cache/moa/ (gitignored)
python3 tools/build_data.py       # data/halls.json, img/covers/*.webp, img/icons/*.svg
node tools/build-sw.mjs           # service worker precache list
npm test
```

`build_data.py` stops if a hall has no English/Malay entry in `translations.py`, so a new MOA hall
cannot ship untranslated.

## Layout

| Path | What |
|---|---|
| `index.html`, `css/app.css` | shell and the eight looks |
| `js/app.js` | routes (`#/`, `#/c/B`, `#/h/19`, `#/settings`) and rendering |
| `js/catalog.js` | search, sort, language pick (pure, tested) |
| `js/prefs.js` | language and appearance, stored under `twagri.prefs.v1` |
| `js/releases.js` | update history shown by `js/whatsnew.js` |
| `js/qrcode.js` | offline QR encoder (from Entomology) |
| `sw.js` | precaches everything; only touches caches named `twagri-*` |
