const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/campaigns', { waitUntil: 'networkidle0' });
  
  // Click the MoreVertical button
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (let b of buttons) {
      if (b.innerHTML.includes('polyline') && b.innerHTML.includes('circle')) {
        // It's probably the MoreVertical icon.
        b.click();
      }
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Click Details
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (let b of buttons) {
      if (b.innerText === 'Details') {
        b.click();
      }
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
