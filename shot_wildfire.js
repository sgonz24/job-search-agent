const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://emberpro-wildfire-insurance.vercel.app/b', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/wildfire_full.png', fullPage: true });

  const imgs = await page.$$eval('img', els => els.map(el => {
    const r = el.getBoundingClientRect();
    return {
      src: el.getAttribute('src'),
      alt: el.getAttribute('alt'),
      natW: el.naturalWidth, natH: el.naturalHeight,
      rendW: Math.round(r.width), rendH: Math.round(r.height),
      topY: Math.round(r.top + window.scrollY),
      objectFit: getComputedStyle(el).objectFit,
      maxWidth: getComputedStyle(el).maxWidth,
    };
  }));
  console.log(JSON.stringify(imgs, null, 2));
  await browser.close();
})();
