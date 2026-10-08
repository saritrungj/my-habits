import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
const browser=await chromium.launch()
const page=await browser.newPage()
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await fs.mkdir('.impeccable/review',{recursive:true})
await page.goto('http://127.0.0.1:3000/today')
await page.getByRole('checkbox').first().waitFor()
for(const theme of ['light','dark']){
 await page.goto('http://127.0.0.1:3000/settings')
 await page.getByRole('combobox',{name:'Theme',exact:true}).selectOption(theme)
 await page.getByRole('button',{name:'บันทึกการตั้งค่า',exact:true}).click()
 await page.waitForTimeout(300)
 for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize(viewport)
  for(const route of ['today','settings','progress','tools','']){
   await page.goto(`http://127.0.0.1:3000/${route}`)
   await page.waitForFunction(() => {const b=document.querySelector('.theme-toggle');return b?.tagName==='BUTTON' && !b.disabled})
   await page.waitForTimeout(200)
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
   if(overflow)errors.push(`${route} ${theme} ${viewport.name} overflow`)
   await page.screenshot({path:`.impeccable/review/${route || 'welcome'}-${theme}-${viewport.name}.png`,fullPage:true})
  }
 }
}
await page.setViewportSize({width:320,height:800})
for(const route of ['today','settings','tasks','goals','focus','mood','finance','tools','tools/convert/length','tools/split-bill']){
 await page.goto(`http://127.0.0.1:3000/${route}`)
 await page.waitForTimeout(150)
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))errors.push(`${route} 320px overflow`)
}
await page.goto('http://127.0.0.1:3000/today')
await page.getByRole('button',{name:'เปลี่ยนเป็นธีมสว่าง'}).click()
await page.waitForTimeout(200)
await page.reload()
await page.waitForTimeout(300)
if(!await page.locator('html').evaluate(el=>el.classList.contains('light')))errors.push('theme persistence failed')
console.log(JSON.stringify({errors},null,2))
await browser.close()
