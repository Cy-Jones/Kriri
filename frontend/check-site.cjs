const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  try {
    const response = await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' });
    console.log('STATUS:', response.status());
    
    // Check if #root has content
    const rootHtml = await page.$eval('#root', el => el.innerHTML);
    if (!rootHtml) {
      console.log('Root element is empty!');
    } else {
      console.log('Root element has content. Length:', rootHtml.length);
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
