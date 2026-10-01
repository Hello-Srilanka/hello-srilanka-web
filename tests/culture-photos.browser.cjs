/* eslint-disable @typescript-eslint/no-require-imports -- Standalone browser integration runner. */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3000';
const ids = ['ayurveda','perahera','dance','craft','tea','festival'];
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440,390]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/#culture-dance`,{waitUntil:'networkidle'});
      await page.waitForTimeout(900);
      let viewed=0;
      for (const id of ids) {
        const gallery=page.locator(`[data-culture-art=${id}]`);
        const count=await gallery.locator('[id^=culture-photo] img').count();
        if (width<768) { await gallery.scrollIntoViewIfNeeded();await page.waitForTimeout(250); }
        for (const index of [...Array(count).keys(),...Array(count).keys()].map((n,i)=>i<count?n:count-1-n)) {
          await gallery.evaluate((el,{index,count,width})=>{
            const root=document.querySelector('#experiences');
            let y;
            if(width>=768){const p=+el.dataset.photoStart+(+el.dataset.photoEnd-+el.dataset.photoStart)*(index+.5)/count;y=+root.dataset.scrollStart+(+root.dataset.scrollEnd-+root.dataset.scrollStart)*p;}
            else {y=scrollY+el.getBoundingClientRect().top-140+(el.offsetHeight-el.firstElementChild.offsetHeight)*(index+.5)/count;}
            window.scrollTo({top:y,behavior:'instant'});
          },{index,count,width});
          await page.waitForTimeout(650);
          assert.equal(await gallery.getAttribute('data-selected-photo'),String(index),`${width} ${id} photo ${index}`);
          assert.equal(await gallery.locator('[id^=culture-photo] img:not([aria-hidden=true])').count(),1);
          if(count>1)assert.equal(await gallery.locator('button').nth(index).getAttribute('aria-pressed'),'true');
          if(width<768&&count>1){const top=await gallery.locator('[id^=culture-photo]').evaluate(el=>el.getBoundingClientRect().top);assert.ok(top>=135&&top<=150,`Mobile photo must remain visible: ${top}`);}
          viewed++;
        }
        if(count>1){await gallery.locator('button').last().click();await page.waitForTimeout(500);assert.equal(await gallery.getAttribute('data-selected-photo'),String(count-1),'Thumbnail seeks timeline');}
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.deepEqual(errors,[]);console.log(`PASS ${width}: ${viewed} forward/reverse photo positions, thumbnails and visibility`);
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
    await page.goto(`${base}/#culture-craft`,{waitUntil:'networkidle'});await page.waitForTimeout(700);
    assert.equal(await page.locator('[data-gallery-motion=scroll]').count(),0);
    const gallery=page.locator('[data-culture-art=craft]');await gallery.locator('button').last().click();assert.equal(await gallery.getAttribute('data-selected-photo'),'4');
    await page.close();console.log('PASS reduced motion: manual gallery without scroll pinning');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
