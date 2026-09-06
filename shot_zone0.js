const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://emberpro-wildfire-insurance.vercel.app/b', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  const el = await page.$('img[src*="img-14"]');
  const section = await el.evaluateHandle(e => e.closest('section'));
  await section.asElement().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const box = await section.asElement().boundingBox();
  await page.screenshot({ path: '/tmp/zone0_section.png', clip: { x: 0, y: box.y, width: 1280, height: box.height } });
  await browser.close();
})();
