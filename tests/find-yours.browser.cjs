/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner. */
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const screenshots = process.env.SCREENSHOTS_DIR;
const pause = page => page.waitForTimeout(650);
async function seek(page, progress) {
  await page.locator('#find-yours [data-enhanced]').evaluate((el, p) => {
    window.scrollTo({ top: +el.dataset.scrollStart + (+el.dataset.scrollEnd - +el.dataset.scrollStart) * p, behavior: 'instant' });
  }, progress);
  await pause(page);
}
async function snapshot(page) {
  return page.locator('[data-animated-scene]').evaluate(el => {
    const one = selector => el.querySelector(selector);
    return {
      route: parseFloat(getComputedStyle(one('[data-mess-route]')).strokeDashoffset),
      clean: parseFloat(getComputedStyle(one('[data-clean-route]')).strokeDashoffset),
      budget: +one('[data-budget]').getAttribute('width'),
      days: [...el.querySelectorAll('[data-day]')].map(day => +getComputedStyle(day).opacity),
      vehicle: one('[data-vehicle]').getAttribute('transform'),
      home: +getComputedStyle(one('[data-home]')).opacity,
      weather: +getComputedStyle(one('[data-weather]')).opacity,
      choices: [...el.querySelectorAll('[data-choice-check]')].map(check => +getComputedStyle(check).opacity),
    };
  });
}
(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      const widths = engine === chromium ? [1440, 1024, 768] : [1440];
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: width === 768 ? 1024 : 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto(`${base}/#find-yours`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);
        await seek(page, .44); const peak = await snapshot(page);
        await seek(page, .48); assert.deepEqual(await snapshot(page), peak, 'The peak holds still');
        assert.ok(peak.route < .001 && peak.budget <= 24 && peak.days.filter(day => day < .2).length === 6 && peak.weather === 1);
        await seek(page, .57); const rewind = await snapshot(page);
        assert.ok(rewind.route > peak.route && rewind.budget > peak.budget && rewind.vehicle !== peak.vehicle, 'Route, vehicle and budget rewind together');
        await seek(page, .71); const home = await snapshot(page);
        assert.ok(home.home === 1 && home.route > .99 && home.weather === 0 && home.days.every(day => day === 1), 'Home reveal restores the journey');
        await seek(page, .785); assert.ok((await snapshot(page)).choices.every(choice => choice === 1), 'Preferences select sequentially');
        await seek(page, .865); const clean = await snapshot(page);
        assert.ok(clean.clean === 0 && clean.budget >= 120, 'Clean itinerary and balanced budget assemble');
        await seek(page, .92);
        const phone = await page.locator('[data-animated-scene]').evaluate(el => {
          const map = el.querySelector('[data-map-shell]').getBoundingClientRect();
          const phone = el.querySelector('[data-phone]').getBoundingClientRect();
          return { map: { x: map.x, y: map.y, right: map.right, bottom: map.bottom }, phone: { x: phone.x, y: phone.y, right: phone.right, bottom: phone.bottom } };
        });
        // Hidden map labels remain in SVG bounds; compare the actual coastline below.
        const island = await page.locator('[data-animated-scene] [data-map-shell] path').first().boundingBox();
        assert.ok(island.x >= phone.phone.x - 5 && island.x + island.width <= phone.phone.right + 5, 'Island transfers inside the phone');
        await seek(page, 1);
        assert.equal(await page.locator('[data-live-planner]').evaluate(el => el.inert), false);
        const preview = page.locator('[data-sample-itinerary] img');
        assert.equal(await preview.evaluate(img => img.complete && img.naturalWidth === 1440), true, 'Actual itinerary export is loaded');
        assert.equal(await page.locator('[data-sample-itinerary] a').first().getAttribute('target'), '_blank');
        assert.equal(await page.locator('[data-live-planner] .personalization-copy a').getAttribute('href'), '/plan');
        await seek(page, .46); assert.ok((await snapshot(page)).route < .001, 'Reverse scrolling reconstructs the messy journey');
        await seek(page, 0);
        const skip = page.locator('[data-skip-story]'); await skip.focus(); await skip.press('Enter'); await pause(page);
        assert.equal(await page.locator('[data-live-planner]').evaluate(el => el.inert), false, 'Keyboard skip reaches the live planner');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
        if (screenshots) await page.screenshot({ path: `${screenshots}/find-verified-${engine.name()}-${width}.png` });
        assert.deepEqual(errors, []);
        console.log(`PASS ${engine.name()} ${width}: freeze, rewind, preferences, route, phone, live planner, reverse and keyboard skip`);
        if (width === 1440 && engine === chromium) {
          await page.emulateMedia({ reducedMotion: 'reduce' }); await pause(page);
          assert.equal(await page.locator('#find-yours [data-enhanced]').count(), 0, 'Live reduced-motion change removes pinning');
          assert.equal(await page.locator('[data-live-planner]').evaluate(el => el.inert), false);
          await page.emulateMedia({ reducedMotion: 'no-preference' }); await pause(page);
          assert.equal(await page.locator('#find-yours [data-enhanced]').count(), 1);
          await page.setViewportSize({ width: 390, height: 844 }); await pause(page);
          assert.equal(await page.locator('#find-yours [data-enhanced]').count(), 0, 'Resize restores natural layout');
        }
        await page.close();
      }
      const modes = engine === chromium ? [{ width: 390 }, { width: 375, reducedMotion: 'reduce' }, { width: 1440, reducedMotion: 'reduce' }, { width: 390, javaScriptEnabled: false }, { width: 1024, height: 600 }] : [{ width: 390 }];
      for (const mode of modes) {
        const page = await browser.newPage({ viewport: { width: mode.width, height: mode.height || 844 }, reducedMotion: mode.reducedMotion, javaScriptEnabled: mode.javaScriptEnabled });
        const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto(`${base}/#find-yours`, { waitUntil: 'networkidle' }); await pause(page);
        assert.equal(await page.locator('#find-yours [data-enhanced]').count(), 0);
        for (const state of ['messy', 'home', 'planned', 'phone']) {
          const scene = page.locator(`[data-scene-state=${state}]`); await scene.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' })); assert.equal(await scene.isVisible(), true);
        }
        assert.equal(await page.locator('[data-live-planner]').evaluate(el => el.inert), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []); await page.close(); console.log(`PASS ${engine.name()} natural flow: ${JSON.stringify(mode)}`);
      }
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
