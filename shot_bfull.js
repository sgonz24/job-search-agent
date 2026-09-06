const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('https://emberpro-wildfire-insurance.vercel.app/b', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  // top of page
  await page.screenshot({ path: '/tmp/b_top.png' });
  // scroll 2x
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/b_mid.png' });
  await browser.close();
})();
