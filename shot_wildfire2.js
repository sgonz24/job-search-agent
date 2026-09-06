const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://emberpro-wildfire-insurance.vercel.app/b', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  const shots = [
    { name: 'img18_top', selector: 'img[src*="img-18"]', index: 0 },
    { name: 'img17', selector: 'img[src*="img-17"]', index: 0 },
    { name: 'img18_step', selector: 'img[src*="img-18"]', index: 1 },
  ];
  for (const s of shots) {
    const els = await page.$$(s.selector);
    const el = els[s.index];
    if (!el) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    // expand bounding box to include surrounding container
    const box = await el.boundingBox();
    const pad = 40;
    await page.screenshot({
      path: `/tmp/w_${s.name}.png`,
      clip: {
        x: Math.max(0, box.x - pad),
        y: Math.max(0, box.y - pad),
        width: Math.min(1280, box.width + pad * 2),
        height: box.height + pad * 2,
      },
    });
  }
  await browser.close();
})();
