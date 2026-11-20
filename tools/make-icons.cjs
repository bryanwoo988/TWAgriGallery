/* Render icons/icon.svg to the PNG sizes the manifest and iOS need, and favicon.ico.
     node tools/make-icons.cjs   (needs Playwright's Chromium; python3 + Pillow for the .ico) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dir = path.join(__dirname, '..', 'icons');
const svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const shot = async (size, file, { pad = 0, bg = 'transparent', radius = true } = {}) => {
    await page.setViewportSize({ width: size, height: size });
    const inner = size - pad * 2;
    // Maskable: full-bleed green, artwork inside the 80% safe zone.
    await page.setContent(`<body style="margin:0;background:${bg}"><img src="${uri}" style="display:block;margin:${pad}px;width:${inner}px;height:${inner}px;${radius ? '' : 'clip-path:inset(0)'}"></body>`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: path.join(dir, file), omitBackground: bg === 'transparent' });
  };
  await shot(192, 'icon-192.png');
  await shot(512, 'icon-512.png');
  await shot(512, 'icon-maskable-512.png', { pad: 52, bg: '#2f7d4f' });
  await shot(180, 'apple-touch-icon.png', { bg: '#2f7d4f' });
  await shot(64, 'favicon-64.png');
  await browser.close();
  execFileSync('python3', ['-c', `from PIL import Image; Image.open('${dir}/favicon-64.png').save('${path.join(dir, '..', 'favicon.ico')}', sizes=[(16,16),(32,32),(48,48)])`]);
  fs.unlinkSync(path.join(dir, 'favicon-64.png'));
  console.log('icons written');
})();
