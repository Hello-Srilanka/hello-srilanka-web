/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser check using an existing Playwright installation. */
// PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3000 node tests/culture-photos.browser.cjs
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const chapters = [['ayurveda', 1], ['perahera', 1], ['dance', 2], ['craft', 5], ['tea', 1], ['festival', 3]];

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(`${base}/#culture-ayurveda`, { waitUntil: 'networkidle' });
        for (const [chapterIndex, [chapter, count]] of chapters.entries()) {
          await page.locator('#experiences nav button').nth(chapterIndex).click();
          await page.waitForTimeout(600);
          const gallery = page.locator(`[data-culture-art="${chapter}"]`);
          for (let index = 0; index < count; index++) {
            if (count > 1) await gallery.locator('button').nth(index).click();
            assert.equal(await gallery.getAttribute('data-selected-photo'), String(index), `${chapter}: selected photo ${index + 1}`);
            assert.equal(await gallery.locator('[id^="culture-photo-"] > img[aria-hidden="false"]').count(), 1);
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`PASS culture galleries ${width}px: all 13 photos selectable`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
