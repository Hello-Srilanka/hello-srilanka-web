/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner, matching the existing map QA. */
// Run with an existing Playwright installation:
// PLAYWRIGHT_MODULE=/path/to/playwright BASE_URL=http://localhost:3000 node tests/culture.browser.cjs
const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { cultureStops: stops, cultureBoundaries } = require('../lib/culture/timeline.ts');
const ids = ['ayurveda', 'perahera', 'dance', 'craft', 'tea', 'festival'];
const errors = [];
const pause = page => page.waitForTimeout(550);
async function seek(page, progress) {
  await page.evaluate(progress => {
    const root = document.querySelector('#experiences');
    window.scrollTo({ top: +root.dataset.scrollStart + (+root.dataset.scrollEnd - +root.dataset.scrollStart) * progress, behavior: 'instant' });
  }, progress);
  await pause(page);
}
async function start(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#experiences').scrollIntoViewIfNeeded();
  await pause(page);
}
(async () => {
  const browser = await engine.launch();
  try {
    for (const width of [375,390,430,768,1024,1280,1440,1920]) {
      const page = await browser.newPage({ viewport: { width, height: width >= 1440 ? 1000 : 900 } });
      await start(page);
      assert.equal(await page.locator('[data-culture-art]').count(), 6);
      assert.equal(await page.locator('#experiences canvas').count(), 0);
      if (width >= 768) {
        await page.waitForFunction(() => document.querySelector('#experiences').dataset.motion === 'pinned');
        let lastPath;
        for (const [i,p] of stops.entries()) {
          await seek(page,p);
          const metrics = await page.locator('#experiences').evaluate(root => {
            const stage = root.querySelector('[data-culture-stage]').getBoundingClientRect();
            const current = root.querySelector('[data-culture-panel]:not([inert])');
            const title = current.querySelector('h2,h3').getBoundingClientRect();
            const description = current.querySelector('p:last-child')?.getBoundingClientRect();
            return { active: +root.dataset.activeChapter, count: root.querySelectorAll('[data-culture-panel]:not([inert])').length, overflow: document.documentElement.scrollWidth > innerWidth, title: { top:title.top, bottom:title.bottom, right:title.right }, stage:{top:stage.top,bottom:stage.bottom}, descriptionBottom:description?.bottom, path: root.querySelector('[data-culture-thread] path').getAttribute('d') };
          });
          assert.equal(metrics.active,i,`${width}: chapter at ${p}`);
          assert.equal(metrics.count,1,'Only one chapter accessible while pinned');
          assert.equal(metrics.overflow,false,`${width}: horizontal overflow`);
          assert.ok(metrics.title.top >= metrics.stage.top + 40,`${width}: heading under masthead`);
          assert.ok(metrics.title.bottom < metrics.stage.bottom - 65,`${width}: heading clipped`);
          assert.ok(metrics.title.right < width,`${width}: heading too wide`);
          if(lastPath) assert.notEqual(metrics.path,lastPath,'Thread changes form');
          lastPath=metrics.path;
          if (process.env.SCREENSHOTS && [0,1,3,6,7].includes(i)) await page.screenshot({path:`${process.env.SCREENSHOTS}/culture-${width}-${i}.png`});
        }
        await seek(page,stops[4]);
        await page.locator('[data-culture-nav]').nth(1).click();
        await pause(page);
        assert.equal(await page.locator('#experiences').getAttribute('data-active-chapter'),'2','Navigation seeks correctly');
        assert.equal(await page.locator('[data-culture-nav][aria-current]').getAttribute('href'),'#culture-perahera');
        await seek(page,stops[1]);
        assert.equal(await page.locator('#experiences').getAttribute('data-active-chapter'),'1','Reverse scrolling restores previous chapter');
        await seek(page,cultureBoundaries[1]);
        assert.equal(await page.locator('[data-culture-panel]').evaluateAll(panels=>panels.filter(p=>+getComputedStyle(p).opacity>.05).length),2,'Chapter transitions crossfade');
        await seek(page,1);
        await page.getByRole('link',{name:'Explore the stories',exact:true}).focus();
        assert.equal(await page.locator(':focus').getAttribute('href'),'/memories');
        await page.evaluate(() => { const root = document.querySelector('#experiences'); window.scrollTo({ top: +root.dataset.scrollEnd + innerHeight, behavior: 'instant' }); });
        await page.waitForTimeout(1100);
        assert.ok(await page.locator('#find-yours').evaluate(el=>el.getBoundingClientRect().top<innerHeight),'Pin releases to following content');
      } else {
        assert.equal(await page.locator('#experiences').getAttribute('data-motion'),null);
        for (const id of ids) {
          await page.locator(`#culture-${id}`).scrollIntoViewIfNeeded();
          await pause(page);
          assert.equal(await page.locator(`#culture-${id}`).getAttribute('aria-hidden'),null);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: overflow`);
          if(process.env.SCREENSHOTS) await page.screenshot({path:`${process.env.SCREENSHOTS}/culture-${width}-${id}.png`});
        }
        await page.locator('[data-culture-nav]').first().click();
        await page.waitForTimeout(1000);
        assert.ok(await page.locator('#culture-ayurveda').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<170),'Mobile anchor navigation');
      }
      console.log(`PASS ${width}px: layout, artwork, navigation, scroll`);
      await page.close();
    }
    const reduced = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await start(reduced);
    assert.equal(await reduced.locator('#experiences').getAttribute('data-motion'),null);
    assert.equal(await reduced.locator('#experiences [inert],#experiences [aria-hidden=true][data-culture-panel]').count(),0);
    assert.equal(await reduced.locator('[data-culture-panel]').count(),8);
    await reduced.locator('[data-culture-nav]').nth(5).click();
    await pause(reduced);
    assert.ok(await reduced.locator('#culture-festival').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<200));
    await reduced.close();
    console.log('PASS reduced motion: natural flow, every chapter accessible, anchors');
    const nojs = await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
    await nojs.goto(base);
    assert.equal(await nojs.locator('[data-culture-panel]').count(),8);
    assert.equal(await nojs.locator('#experiences [inert]').count(),0);
    assert.equal(await nojs.locator('[data-culture-art]').count(),6);
    await nojs.close();
    console.log('PASS no JavaScript: full content and artwork rendered');
    const dynamic = await browser.newPage({viewport:{width:1440,height:900}});
    await start(dynamic);
    await seek(dynamic,stops[4]);
    await dynamic.emulateMedia({reducedMotion:'reduce'});
    await pause(dynamic);
    assert.equal(await dynamic.locator('#experiences').getAttribute('data-motion'),null);
    assert.equal(await dynamic.locator('#experiences [inert]').count(),0);
    await dynamic.emulateMedia({reducedMotion:'no-preference'});
    await pause(dynamic);
    assert.equal(await dynamic.locator('#experiences').getAttribute('data-motion'),'pinned');
    await dynamic.setViewportSize({width:390,height:844});
    await pause(dynamic);
    assert.equal(await dynamic.locator('#experiences').getAttribute('data-motion'),null);
    assert.equal(await dynamic.locator('#experiences [inert]').count(),0);
    await dynamic.close();
    console.log('PASS live motion preference and desktop/mobile cleanup');
    const deep = await browser.newPage({viewport:{width:1440,height:900}});
    await deep.goto(`${base}/#culture-tea`,{waitUntil:'networkidle'});
    await deep.waitForTimeout(1200);
    assert.equal(await deep.locator('#experiences').getAttribute('data-active-chapter'),'5','Direct chapter link');
    await seek(deep,1);
    await deep.getByRole('link',{name:'Explore the stories',exact:true}).click();
    await deep.waitForURL(/\/memories$/);
    await deep.close();
    for (const options of [{viewport:{width:390,height:844},isMobile:true,hasTouch:true},{viewport:{width:1440,height:900},reducedMotion:'reduce'},{viewport:{width:1280,height:560}}]) {
      const page = await browser.newPage(options);
      await page.goto(`${base}/#culture-tea`, {waitUntil:'networkidle'});
      await pause(page);
      assert.equal(await page.locator('#experiences').getAttribute('data-motion'),null);
      assert.ok(await page.locator('#culture-tea').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<200),'Natural-layout direct chapter link');
      await page.close();
    }
    console.log('PASS touch, reduced motion and short-screen direct chapter links');
    assert.deepEqual(errors,[],'No browser exceptions or console errors');
    console.log('PASS deep link and no browser exceptions');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
