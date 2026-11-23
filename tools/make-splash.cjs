#!/usr/bin/env node
/* iOS launch images (apple-touch-startup-image): iOS shows a blank screen at
   launch unless the page lists one image per screen size. This draws the same
   launch screen as index.html (the icon alone: iOS cannot know the reader's
   language, and the app shows one language only, on the Classic background) at each size with Playwright, writes icons/splash/*.png
   and prints the <link> tags for index.html.

     node tools/make-splash.cjs
     # then shrink them (flat colours: a 96-colour palette loses nothing visible, 2 MB -> 0.4 MB)
     python3 -c "import glob; from PIL import Image; [Image.open(f).convert('RGB').quantize(96, dither=0).save(f, optimize=True) for f in glob.glob('icons/splash/*.png')]"

   Sizes: CSS width x height and pixel ratio of current iPhones and iPads, portrait. */
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const DEVICES = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [414, 896, 3], [375, 812, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2], [320, 568, 2],
  [1032, 1376, 2], [1024, 1366, 2], [834, 1210, 2], [834, 1194, 2], [820, 1180, 2], [810, 1080, 2], [768, 1024, 2], [744, 1133, 2],
];
const icon = 'data:image/svg+xml;base64,' + readFileSync(join(ROOT, 'icons/icon.svg')).toString('base64');
const page = `<!doctype html><meta charset="utf-8"><style>
  html, body { margin: 0; height: 100%; background: #f6f8f3; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
    font-family: -apple-system, "PingFang TC", "Noto Sans TC", "Noto Sans CJK TC", sans-serif; color: #17211a; text-align: center; }
  img { width: 96px; height: 96px; border-radius: 22px; margin-bottom: 14px; box-shadow: 0 8px 28px rgb(0 0 0 / .12); }
  .n { font-size: 21.6px; font-weight: 700; } .s { font-size: 15.2px; color: #5f6c62; }
</style><img src="${icon}">`;

(async () => {
  mkdirSync(join(ROOT, 'icons/splash'), { recursive: true });
  const browser = await chromium.launch();
  const links = [];
  for (const [w, h, r] of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: r });
    const p = await ctx.newPage();
    await p.setContent(page);
    await p.waitForTimeout(100);
    const file = `icons/splash/${w * r}x${h * r}.png`;
    await p.screenshot({ path: join(ROOT, file) });
    await ctx.close();
    links.push(`  <link rel="apple-touch-startup-image" href="${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)">`);
  }
  await browser.close();
  console.log(links.join('\n'));
})();
