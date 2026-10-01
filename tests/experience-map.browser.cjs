/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner. */
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.TEST_BASE_URL || 'http://localhost:3002';
const output = process.env.TEST_ARTIFACTS || '/tmp/hellosrilanka-map-review';
const engine = process.env.TEST_BROWSER_ENGINE === 'webkit' ? webkit : chromium;

async function range(page) {
  return page.locator('[data-motion]').evaluate(el => ({
    start: el.getBoundingClientRect().top + scrollY - (innerWidth > 900 ? 91 : 76),
    distance: innerHeight * (innerWidth <= 600 ? 2.8 : 3.4),
  }));
}
async function progress(page, bounds, amount) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), bounds.start + bounds.distance * amount);
  await page.waitForTimeout(850);
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await engine.launch({ headless: true });
  const failures = [], results = [];
  const monitor = page => {
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  };
  try {
    for (const [width, height] of [[375, 844], [390, 844], [768, 1000], [1024, 1000], [1440, 1000], [1920, 1000], [1440, 600]]) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600 });
      const page = await context.newPage(); monitor(page);
      await page.goto(base);
      await page.waitForSelector('[data-motion="scroll"]');
      await page.waitForTimeout(600);
      const bounds = await range(page);
      assert.equal(await page.locator('[data-destination-route]').count(), 33);
      await progress(page, bounds, 0);
      assert.equal(await page.locator('[data-motion]').getAttribute('data-interactive'), 'false');
      assert.equal(await page.locator('[data-map-controls]').first().evaluate(el => el.inert), true);
      await noOverflow(page);
      await page.screenshot({ path: `${output}/opening-${width}.png` });
      if (height === 600 || width === 390) {
        await progress(page, bounds, .3);
        const before = await page.locator('[data-plane]').getAttribute('transform');
        if (width < 600 && engine === chromium) {
          const touch = await context.newCDPSession(page);
          await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: 650 }] });
          for (let y = 620; y >= 260; y -= 30) {
            await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y }] });
            await page.waitForTimeout(30);
          }
          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await touch.detach();
        } else if (width < 600) await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'instant' }));
        else await page.mouse.wheel(0, height * .5);
        await page.waitForTimeout(900);
        assert.notEqual(await page.locator('[data-plane]').getAttribute('transform'), before, 'Real wheel scrolling moves the aircraft, including short viewports');
        const aircraft = await page.locator('[data-plane]').boundingBox();
        assert.ok(aircraft.x >= 0 && aircraft.x < width && aircraft.y > 75 && aircraft.y < height, 'Aircraft is visible during the approach');
        assert.ok(await page.locator('[data-plane]').evaluate(el => Number(getComputedStyle(el.parentElement).opacity) > .9), 'Aircraft is independent of the island fade');
        await page.screenshot({ path: `${output}/wheel-${width}x${height}.png` });
      }
      if (width === 1440) {
        await progress(page, bounds, .45);
        const plane = await page.locator('[data-plane]').getAttribute('transform');
        await page.waitForTimeout(500);
        assert.equal(await page.locator('[data-plane]').getAttribute('transform'), plane, 'No autoplay once scroll settles');
        await page.screenshot({ path: `${output}/approach-${width}.png` });
        await progress(page, bounds, .7);
        assert.equal(await page.locator('[data-destination-route-reveal]').evaluateAll(paths => paths.every(path => parseFloat(path.style.strokeDashoffset) === 1)), true, 'Onward routes wait until after touchdown');
        await page.screenshot({ path: `${output}/arrival-${width}.png` });
      }
      if (width === 390 || width === 1440) {
        await progress(page, bounds, .8);
        const offset = await page.locator('[data-destination-route-reveal="jaffna"]').evaluate(el => parseFloat(el.style.strokeDashoffset));
        assert.ok(offset > 0 && offset < 1, 'Onward route progressively draws after landing');
        const arrow = await page.locator('[data-destination-route-arrow="jaffna"]').getAttribute('transform');
        await page.waitForTimeout(300);
        assert.equal(await page.locator('[data-destination-route-arrow="jaffna"]').getAttribute('transform'), arrow, 'Route arrows are scroll controlled');
        await page.screenshot({ path: `${output}/onward-${width}.png` });
        await progress(page, bounds, .86);
        assert.ok(await page.locator('[data-destination-route-reveal="jaffna"]').evaluate(el => parseFloat(el.style.strokeDashoffset)) < offset);
        assert.notEqual(await page.locator('[data-destination-route-arrow="jaffna"]').getAttribute('transform'), arrow);
        await progress(page, bounds, .7);
        assert.equal(await page.locator('[data-destination-route-reveal]').evaluateAll(paths => paths.every(path => parseFloat(path.style.strokeDashoffset) === 1)), true, 'Routes retract when scrolling back to touchdown');
      }
      await progress(page, bounds, .98);
      assert.equal(await page.locator('[data-motion]').getAttribute('data-interactive'), 'true');
      assert.equal(await page.locator('[data-destination]').count(), 33);
      assert.equal(await page.locator('[data-destination-route-reveal]').evaluateAll(paths => paths.every(path => parseFloat(path.style.strokeDashoffset) === 0)), true, 'Every destination is connected');
      assert.equal(await page.locator('[data-artwork-visible="true"]').count(), width < 768 ? 15 : width < 1024 ? 20 : 32);
      const visibleImages = page.locator('[data-artwork-visible="true"] img');
      await visibleImages.evaluateAll(images => Promise.all(images.map(img => img.decode())));
      assert.equal(await visibleImages.evaluateAll(images => images.every(img => img.naturalWidth > 0 && img.currentSrc.includes('/images/map/thumbnails/'))), true);
      const canvas = page.locator('canvas');
      await page.waitForTimeout(700);
      const renders = await canvas.getAttribute('data-render-count');
      await page.waitForTimeout(250);
      assert.equal(await canvas.getAttribute('data-render-count'), renders, 'Miniatures do not run an idle render loop');
      const tapTarget = await page.locator('[data-destination="sigiriya"]').boundingBox();
      assert.ok(tapTarget.width >= 43.9 && tapTarget.height >= 43.9);
      await noOverflow(page);
      await page.screenshot({ path: `${output}/map-${width}.png` });
      const sigiriya = page.locator('[data-destination="sigiriya"]');
      if (width < 600) await sigiriya.tap(); else await sigiriya.hover();
      assert.equal(await sigiriya.getAttribute('data-engaged'), 'true');
      await page.waitForTimeout(250);
      assert.equal(await page.locator('#map-destination-name').innerText(), 'SIGIRIYA');
      assert.equal(await page.locator('[data-destination-route="sigiriya"]').getAttribute('data-route-active'), 'true');
      const card = await page.locator('#map-place-details article').boundingBox();
      assert.ok(card.x >= 0 && card.x + card.width <= width && card.y > 75 && card.y + card.height <= 1000);
      await page.screenshot({ path: `${output}/card-${width}.png` });
      await page.getByRole('button', { name: 'Close destination details' }).click();
      assert.equal(await page.locator('#map-destination-name').count(), 0, 'Closing does not reopen the focused marker');
      await sigiriya.focus();
      await sigiriya.press('Enter');
      await page.waitForFunction(() => document.activeElement?.matches('#map-place-details a'));
      assert.equal(await page.locator('#map-place-details a').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#map-destination-name').count(), 0);
      assert.equal(await sigiriya.evaluate(el => el === document.activeElement), true);
      assert.equal(await page.getByRole('group', { name: 'Filter map by experience' }).count(), 0);
      assert.equal(await page.getByLabel('Choose a destination', { exact: true }).count(), 0);
      await page.locator('[data-destination="hiriketiya"]').focus();
      assert.equal(await page.locator('#map-destination-name').innerText(), 'HIRIKETIYA');
      if (width === 1440) {
        await progress(page, bounds, .35);
        assert.equal(await page.locator('[data-map-controls]').first().evaluate(el => el.inert), true, 'Reverse scroll disables map controls');
        if (await page.locator('[data-skip-flight]').count()) {
          await page.locator('[data-skip-flight]').click();
          await page.waitForTimeout(700);
          assert.equal(await page.locator('[data-motion]').getAttribute('data-interactive'), 'true');
          assert.equal(await page.locator('[data-destination]').first().evaluate(el => el === document.activeElement), true);
        }
      }
      await progress(page, bounds, 1.2);
      assert.ok((await page.locator('[data-journey-stage]').boundingBox()).y < 70, 'Pin releases into existing stories');
      assert.equal(await page.locator('#island-stories .story-scene').count(), 5);
      assert.equal(await page.locator('.nav-cta').getAttribute('href'), '/plan');
      results.push({ width, height, interactive: true, overflow: false });
      await context.close();
    }

    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage(); monitor(page);
      await page.goto(base); await page.waitForSelector('[data-motion="static"]');
      assert.equal(await page.locator('[data-motion]').getAttribute('data-interactive'), 'true');
      assert.equal(await page.locator('[data-destination-route-reveal]').evaluateAll(paths => paths.every(path => parseFloat(path.style.strokeDashoffset) === 0)), true, 'Reduced motion shows completed routes');
      assert.equal(await page.locator('[data-journey-stage]').evaluate(el => el.parentElement.classList.contains('pin-spacer')), false);
      await page.locator('[data-destination="ella"]').focus();
      assert.equal(await page.locator('#map-destination-name').innerText(), 'ELLA');
      await page.locator('[aria-label="Explore Sri Lanka destinations"]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${output}/reduced-${width}.png` });
      const plane = await page.locator('[data-plane]').getAttribute('transform');
      await page.evaluate(() => window.scrollBy({ top: 100, behavior: 'instant' }));
      assert.equal(await page.locator('[data-plane]').getAttribute('transform'), plane);
      await noOverflow(page);
      await context.close();
    }

    const fallback = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const fallbackPage = await fallback.newPage(); monitor(fallbackPage);
    await fallbackPage.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type.startsWith('webgl') ? null : getContext.call(this, type, ...args); };
    });
    await fallbackPage.goto(base); await fallbackPage.waitForSelector('[data-motion="static"]');
    await fallbackPage.locator('[data-destination="galle-fort"]').focus();
    assert.equal(await fallbackPage.locator('canvas[data-ready]').count(), 0);
    assert.equal(await fallbackPage.locator('canvas + svg').evaluate(el => getComputedStyle(el).visibility), 'visible');
    assert.equal(await fallbackPage.locator('#map-destination-name').innerText(), 'GALLE FORT');
    await fallbackPage.locator('[aria-label="Explore Sri Lanka destinations"]').scrollIntoViewIfNeeded();
    await fallbackPage.waitForTimeout(350);
    await fallbackPage.screenshot({ path: `${output}/fallback-390.png` });
    await fallback.close();

    const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const noJSPage = await noJS.newPage();
    await noJSPage.goto(base);
    assert.equal(await noJSPage.locator('noscript li').count(), 33);
    await noOverflow(noJSPage);
    await noJS.close();
    assert.deepEqual(failures, [], 'No runtime or hydration errors');
    console.log(JSON.stringify({ engine: process.env.TEST_BROWSER_ENGINE || 'chromium', results, reducedMotion: [390, 1440], webglFallback: true, noJavaScript: true, errors: failures }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
