/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser check using an existing Playwright installation. */
// PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3000 node tests/culture.browser.cjs
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';

async function checkPage(browser, width, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(`${base}/#culture-craft`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#experiences')?.dataset.activeChapter === '4');
    const root = page.locator('#experiences');
    assert.equal(await root.locator('[aria-roledescription="slide"]:not([inert])').count(), 1);
    assert.equal(await root.locator('nav button[aria-current="step"]').getAttribute('aria-label'), '04 — MAKE: Sri Lankan crafts & art');

    const layout = await root.evaluate(element => {
      const stage = element.querySelector('[data-culture-stage]').getBoundingClientRect();
      const active = element.querySelector('[aria-roledescription="slide"]:not([inert])');
      const title = active.querySelector('h3').getBoundingClientRect();
      const artwork = active.querySelector('[data-culture-art]').getBoundingClientRect();
      const controls = element.querySelector('button[aria-label="Next culture story"]').getBoundingClientRect();
      return { stage: { top: stage.top, bottom: stage.bottom }, title: { top: title.top, bottom: title.bottom }, artworkBottom: artwork.bottom, controlsTop: controls.top, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(layout.overflow, false, `${width}px: no page-wide horizontal overflow`);
    assert.ok(layout.title.top >= layout.stage.top + 40, `${width}px: heading fits below top controls`);
    assert.ok(layout.title.bottom < layout.controlsTop, `${width}px: heading clears bottom controls`);
    assert.ok(layout.artworkBottom < layout.controlsTop, `${width}px: gallery clears bottom controls`);

    await page.getByRole('button', { name: 'Next culture story' }).click();
    await page.waitForFunction(() => document.querySelector('#experiences')?.dataset.activeChapter === '5');
    await page.getByRole('button', { name: 'Previous culture story' }).click();
    await page.waitForFunction(() => document.querySelector('#experiences')?.dataset.activeChapter === '4');
    await page.getByRole('button', { name: '02 — CELEBRATE: Kandy Esala Perahera' }).click();
    await page.waitForFunction(() => document.querySelector('#experiences')?.dataset.activeChapter === '2');
    assert.ok(page.url().endsWith('#culture-perahera'), 'Chapter dots update the deep link');

    if (reducedMotion === 'reduce') {
      assert.equal(await page.getByRole('button', { name: 'Play automatic stories' }).isEnabled(), false);
    } else {
      assert.equal(await page.getByRole('button', { name: 'Play automatic stories' }).isEnabled(), true);
    }
    await page.locator('#find-yours').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('#find-yours').evaluate(element => element.getBoundingClientRect().top < innerHeight), 'Page scroll exits the slider');
    assert.deepEqual(errors, []);
    console.log(`PASS culture slider ${width}px ${reducedMotion}`);
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 768, 1440]) await checkPage(browser, width);
    await checkPage(browser, 390, 'reduce');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
