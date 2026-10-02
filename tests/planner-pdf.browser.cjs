/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS browser check. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => sessionStorage.setItem('hellosrilanka-planner-session-v2', JSON.stringify({
      version: 2, flowVersion: 4, expiresAt: Date.now() + 3600000,
      preferences: {
        undecided: true, arrivalDate: '', departureDate: '', duration: 21, month: 'December',
        arrival: 'Bandaranaike International Airport (CMB)', departure: 'Bandaranaike International Airport (CMB)',
        arrivalTime: '', departureTime: '', adults: 2, children: 0, ages: [], interests: ['Nature', 'Culture'],
        nationality: '', otherNationality: '', useNationalitySuggestions: false,
        pace: 'Balanced', budget: '', currency: 'USD', transport: 'Help me decide', accommodation: 'Help me decide',
        mustVisit: '', accessibility: '',
      },
      step: 4, furthest: 4, editing: false, screen: 'form', requestId: null,
    })));
    await page.goto((process.env.TEST_BASE_URL || 'http://localhost:3001') + '/plan');
    await page.getByRole('button', { name: 'Create my itinerary', exact: true }).click();
    await page.locator('#result-heading').waitFor();
    await page.locator('#download-full-itinerary').click();
    await page.locator('.journal-export-toolbar small').waitFor({ timeout: 60000 });
    const count = Number((await page.locator('.journal-export-toolbar small').innerText()).split(' ')[0]);
    assert.ok(count > 1, 'long itineraries produce multiple preview pages');
    assert.equal(await page.locator('.journal-export-all').getAttribute('open'), null, 'individual links stay collapsed until opened');
    const button = page.locator('.journal-export-settings').getByRole('button', { name: `Download all ${count} pages as PDF` });
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
    await button.click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'HelloSriLanka-full-journey.pdf');
    const directory = path.join(process.cwd(), 'tmp/pdfs');
    await fs.mkdir(directory, { recursive: true });
    const target = path.join(directory, 'planner-qa.pdf');
    await download.saveAs(target);
    const header = await fs.readFile(target);
    assert.equal(header.subarray(0, 5).toString(), '%PDF-');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'PDF action fits on mobile');
    await page.screenshot({ path: path.join(directory, 'export-mobile-qa.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ result: 'PASS', previewPages: count, pdf: target, bytes: header.length }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
