/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpile(fs.readFileSync(filename, 'utf8'), { module: ts.ModuleKind.CommonJS }), filename);
const { createLandingSample } = require('../lib/planner/landing-sample.ts');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/#your-planner`, { waitUntil: 'networkidle' });
      const image = page.locator('[data-sample-itinerary] img');
      await image.scrollIntoViewIfNeeded();
      assert.equal(await image.evaluate(img => img.naturalWidth), 1440);
      assert.equal(await page.locator('.itinerary-page').count(), 0, 'Full itinerary component is not mounted');
      const box = await image.boundingBox();
      assert.ok(box.width <= 440 && box.height <= 587, 'Compact image-sized preview');
      const popupPromise = page.waitForEvent('popup');
      await page.locator('[data-sample-itinerary] a').first().click();
      const popup = await popupPromise; await popup.waitForLoadState();
      assert.match(popup.url(), /overview-1\.png$/); await popup.close();
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-sample-itinerary] a[download]').click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), 'HelloSriLanka-sample-itinerary.png');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `/tmp/hellosrilanka-map-qa/compact-sample-${width}.png` });
      assert.deepEqual(errors, []); await page.close();
      console.log(`PASS ${width}: compact image, full-size view, PNG download and no overflow`);
    }
    const page = await browser.newPage();
    await page.addInitScript(sample => localStorage.setItem('hellosrilanka-planner-v1', JSON.stringify({ preferences: sample.preferences, itinerary: sample, screen: 'result' })), createLandingSample());
    await page.goto(`${base}/plan`, { waitUntil: 'networkidle' });
    await page.locator('#download-itinerary').click();
    await page.locator('.export-previews img').first().waitFor({ state: 'visible' });
    const identical = await page.locator('.export-previews img').first().evaluate(async img => {
      const exported = new Uint8Array(await (await fetch(img.src)).arrayBuffer());
      const sample = new Uint8Array(await (await fetch('/images/planner-sample/overview-1.png')).arrayBuffer());
      return exported.length === sample.length && exported.every((byte, index) => byte === sample[index]);
    });
    assert.equal(identical, true, 'Preview is byte-identical to the customer planner PNG export');
    console.log('PASS exact planner-export PNG equality');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
