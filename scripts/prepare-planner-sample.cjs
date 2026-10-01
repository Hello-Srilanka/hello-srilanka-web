/* eslint-disable @typescript-eslint/no-require-imports -- Run with the local site and Playwright. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpile(fs.readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS }), filename);
const { createLandingSample } = require('../lib/planner/landing-sample.ts');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(sample => localStorage.setItem('hellosrilanka-planner-v1', JSON.stringify({ preferences: sample.preferences, itinerary: sample, screen: 'result' })), createLandingSample());
    await page.goto(`${process.env.BASE_URL || 'http://localhost:3000'}/plan`, { waitUntil: 'networkidle' });
    await page.locator('#download-itinerary').click();
    await page.locator('.export-previews img').first().waitFor({ state: 'visible' });
    const exported = await page.locator('.export-previews img').evaluateAll(async images => Promise.all(images.map(async img => {
      const bytes = new Uint8Array(await (await fetch(img.src)).arrayBuffer());
      let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
      return { label: img.alt, width: img.naturalWidth, height: img.naturalHeight, base64: btoa(binary) };
    })));
    const directory = path.resolve(__dirname, '../public/images/planner-sample');
    fs.mkdirSync(directory, { recursive: true });
    const manifest = exported.map((item, index) => {
      const filename = `overview-${index + 1}.png`;
      fs.writeFileSync(path.join(directory, filename), Buffer.from(item.base64, 'base64'));
      return { src: `/images/planner-sample/${filename}`, label: item.label, width: item.width, height: item.height };
    });
    fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Saved ${manifest.length} original planner-export PNGs.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
