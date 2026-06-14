import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  let errorCaught = false;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR CONSOLE:', msg.text());
      errorCaught = true;
    }
  });
  
  page.on('pageerror', error => {
    console.log('BROWSER PAGEERROR:', error.message, error.stack);
    errorCaught = true;
  });

  await page.goto('http://localhost:5173/campaigns', { waitUntil: 'networkidle0' });
  
  // Find all tr elements
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr.table-row-hover'));
    if (rows.length > 0) {
      // Find the button in the last td
      const btns = rows[0].querySelectorAll('button');
      if (btns.length > 0) btns[0].click();
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Find Details button inside the menu
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const detailsBtn = buttons.find(b => b.textContent && b.textContent.includes('Details'));
    if (detailsBtn) detailsBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  if (!errorCaught) {
    console.log("No error caught.");
  }
  
  await browser.close();
})();
