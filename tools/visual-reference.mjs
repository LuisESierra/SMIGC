import { chromium } from '@playwright/test';
const browser = await chromium.launch({channel:'msedge',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('https://museo.uao.edu.co/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(4000);
await page.screenshot({path:'docs/museum-reference.png'});
await browser.close();
