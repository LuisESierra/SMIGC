import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:900}});
 const page=await context.newPage();
 await page.goto('http://localhost:4173/');
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 results.push({width,violations:result.violations});
 await context.close();
}
writeFileSync('docs/accessibility.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({width:r.width,violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))})),null,2));
await browser.close();
