/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner. */
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const output = process.env.SCREENSHOTS_DIR;
const pause = page => page.waitForTimeout(800);
async function seek(page, progress) {
  await page.locator('[data-memory-transition]').evaluate((el, p) => window.scrollTo({
    top: +el.dataset.scrollStart + (+el.dataset.scrollEnd - +el.dataset.scrollStart) * p, behavior: 'instant',
  }), progress);
  await pause(page);
}
async function checkOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
}
async function checkFinal(page) {
  const root = page.locator('[data-memory-transition]');
  assert.equal(await root.locator('[data-memory-wall]').evaluate(el => el.inert), false);
  const links = root.locator('[data-memory-invitation] a');
  assert.deepEqual(await links.evaluateAll(els => els.map(el => el.getAttribute('href'))), ['/memories', '/memories']);
  assert.equal(await root.locator('[data-memory-card]').count(), 8);
  for (const card of await root.locator('[data-memory-card]').all()) {
    if (!await card.isVisible()) continue;
    const image = card.locator('img');
    await image.evaluate(img => img.decode());
    assert.ok(await image.evaluate(img => img.naturalWidth > 0), 'Local photograph loads');
    const textFits = await card.locator('[data-memory-details]').evaluate(el => {
      const last = el.lastElementChild.getBoundingClientRect();
      return last.bottom <= el.getBoundingClientRect().bottom + 1;
    });
    assert.ok(textFits, 'Card text and metadata fit without clipping');
  }
  await checkOverflow(page);
}
(async () => {
  for (const engine of [chromium, webkit].filter(engine => !process.env.MEMORY_CHECK_ENGINE || engine.name() === process.env.MEMORY_CHECK_ENGINE)) {
    const browser = await engine.launch();
    try {
      for (const width of process.env.MEMORY_CHECK_MODE === 'static' ? [] : engine === chromium ? [768, 1024, 1280, 1440, 1920] : [1440]) {
        const page = await browser.newPage({ viewport: { width, height: width === 768 ? 1024 : width === 1280 ? 720 : 900 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => document.querySelector('[data-memory-transition]')?.dataset.scrollEnd);
        await seek(page, 0);
        assert.equal(await page.locator('[data-memory-itinerary]').evaluate(el => el.inert), false);
        assert.equal(await page.locator('[data-sample-itinerary] img').evaluate(el => el.naturalWidth), 1440);
        await seek(page, .32);
        const rowsAlign = await page.locator('[data-memory-transition]').evaluate(root => {
          const image = root.querySelector('[data-sample-itinerary] img').getBoundingClientRect();
          return [...root.querySelectorAll('[data-travel-memory]')].every(card => {
            const row = card.getBoundingClientRect();
            return Math.abs(row.x - (image.x + image.width * 100 / 1440)) < 3
              && Math.abs(row.y - (image.y + image.height * +card.dataset.rowTop / 1920)) < 3;
          });
        });
        assert.ok(rowsAlign, 'Photographs originate in the actual exported itinerary rows');
        await seek(page, .58);
        assert.equal(await page.locator('[data-sample-itinerary]').evaluate(el => +getComputedStyle(el).opacity), 0);
        await seek(page, .735);
        const inPhone = await page.locator('[data-memory-transition]').evaluate(root => {
          const phone = root.querySelector('[data-memory-phone]').getBoundingClientRect();
          return [...root.querySelectorAll('[data-travel-memory]')].every(el => {
            const r = el.getBoundingClientRect();
            return r.left >= phone.left && r.right <= phone.right && r.top >= phone.top && r.bottom <= phone.bottom;
          });
        });
        assert.ok(inPhone, 'All four same photo elements collect inside the phone');
        await seek(page, .821);
        assert.equal(await page.locator('[data-share-check]').evaluate(el => +getComputedStyle(el).opacity), 1);
        assert.equal(await page.locator('[data-memory-composer] button').count(), 0, 'Sharing is illustrative and cannot publish');
        await seek(page, 1); await checkFinal(page);
        if (output) await page.screenshot({ path: `${output}/memory-wall-${engine.name()}-${width}.png` });
        await seek(page, .1);
        assert.equal(await page.locator('[data-memory-itinerary]').evaluate(el => el.inert), false, 'Reversing restores the itinerary links');
        const skip = page.locator('[data-skip-memories]');
        await skip.focus(); await skip.press('Enter'); await pause(page);
        assert.equal(await page.locator('[data-memory-invitation] h2').evaluate(el => el === document.activeElement), true, 'Keyboard skip focuses the final invitation');
        await checkFinal(page);
        await seek(page, 1.1);
        assert.ok(await page.locator('[data-find-stage]').evaluate(el => el.getBoundingClientRect().top < -100), 'Pin releases into normal page flow');
        if (width === 1440 && engine === chromium) {
          await seek(page, 1);
          await page.locator('[data-memory-invitation] a').first().click();
          await page.waitForURL('**/memories');
          assert.match(page.url(), /\/memories$/);
          await page.goBack({ waitUntil: 'networkidle' });
          await page.waitForFunction(() => document.querySelector('[data-memory-transition]')?.dataset.scrollEnd);
          await seek(page, 1);
          await page.locator('[data-community-memory] a').first().click();
          await page.waitForURL('**/memories#post=tea-country-voices');
          await page.getByRole('dialog').waitFor({ state: 'visible' });
          assert.ok(await page.getByRole('dialog').innerText().then(text => text.includes('The people are part of the place.')), 'Existing post deep link opens its memory');
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${engine.name()} ${width}: row masks, gallery, share, wall, reverse, keyboard skip, pin release and overflow`);
        await page.close();
      }
      const modes = process.env.MEMORY_CHECK_MODE === 'desktop' ? [] : engine === chromium ? [
        { width: 375 }, { width: 390 }, { width: 430 },
        { width: 1440, reducedMotion: 'reduce' }, { width: 390, reducedMotion: 'reduce' },
        { width: 390, javaScriptEnabled: false },
      ] : [{ width: 390 }];
      for (const mode of modes) {
        const page = await browser.newPage({ viewport: { width: mode.width, height: 900 }, reducedMotion: mode.reducedMotion, javaScriptEnabled: mode.javaScriptEnabled });
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${base}/#your-planner`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('[data-memory-enhanced]').count(), 0);
        await page.locator('[data-memory-wall]').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
        await pause(page);
        await checkFinal(page);
        if (output) await page.screenshot({ path: `${output}/memory-static-${mode.width}-${mode.reducedMotion || 'default'}-${mode.javaScriptEnabled !== false}.png` });
        assert.deepEqual(errors, []); await page.close();
        console.log(`PASS ${engine.name()} natural flow: ${JSON.stringify(mode)}`);
      }
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
