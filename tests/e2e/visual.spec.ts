import { expect, test } from '@playwright/test'
import { defaultState } from '../../shared/domain/types'
import { dateOffset, localDateKey } from '../../shared/domain/dates'

test('calm themes are readable and fit mobile and desktop',async({page})=>{
  test.setTimeout(120_000)
  await page.goto('/today');await expect(page.getByRole('checkbox').first()).toBeEnabled()
  const today=localDateKey(),state=defaultState();state.settings.modules.focus={inToday:true};state.settings.modules.mood={inToday:true}
  state.tasks=[{id:'sample',title:'เตรียมงานสำหรับพรุ่งนี้',date:today,status:'todo',priority:'med',time:'16:00',subtasks:[],createdAt:new Date().toISOString()}]
  state.financeEntries=[{id:'sample-income',date:today,kind:'income',amountMinor:120000,currency:'THB',category:'รายรับตัวอย่าง'},{id:'sample-expense',date:today,kind:'expense',amountMinor:15000,currency:'THB',category:'อาหาร'}]
  for(const [index,count] of [1,3,6].entries()){const date=dateOffset(today,-index);state.habitDays[date]={habitIds:state.habits.map(h=>h.id),done:Object.fromEntries(state.habits.slice(0,count).map(h=>[h.id,true])),threshold:4,rest:false}}
  const color=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number)
  const luminance=(value:string)=>color(value).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i]!,0)
  const contrast=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
  for(const theme of ['light','dark'] as const){
    state.settings.theme=theme
    await page.evaluate(async state=>{const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('myhabit-v2',1);r.onsuccess=()=>resolve(r.result)});await new Promise<void>(resolve=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({key:'guest',state,revision:0,savedAt:new Date().toISOString()});tx.oncomplete=()=>resolve()});db.close()},state)
    for(const size of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]){
      await page.setViewportSize({width:size.width,height:size.height})
      for(const [name,route] of [['today','/today'],['settings','/settings'],['progress','/progress'],['finance','/finance']] as const){
        await page.goto(route);await expect(page.locator('html')).toHaveClass(new RegExp(theme))
        await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true)
        const pairs=await page.locator('.muted,.calendar-day,.btn-primary').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().width>0).map(el=>{
          let ancestor:Element|null=el,bg=''
          while(ancestor){bg=getComputedStyle(ancestor).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')break;ancestor=ancestor.parentElement}
          return {text:el.textContent?.slice(0,60),fg:getComputedStyle(el).color,bg}
        }))
        for(const pair of pairs)expect.soft(contrast(pair.fg,pair.bg),`${theme} ${name}: ${pair.text}`).toBeGreaterThanOrEqual(4.5)
        await page.screenshot({path:`artifacts/ui-review/${name}-${theme}-${size.name}.png`,fullPage:true})
      }
    }
    await page.setViewportSize({width:360,height:800})
    for(const route of ['/tasks','/goals','/focus','/mood','/tools','/tools/convert/length','/settings?section=modules&module=focus']){
      await page.goto(route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${theme} ${route} fits 360px`).toBe(true)
    }
    await page.goto('/tools/split-bill');await page.getByRole('spinbutton').first().fill('100')
    await page.getByText('สร้าง QR PromptPay ในเครื่อง (ไม่บังคับ)',{exact:true}).click();await page.getByPlaceholder('กรอกเพื่อสร้าง QR').fill('0812345678')
    await expect(page.locator('img').first()).toBeVisible();expect(await page.locator('img').first().getAttribute('src')).toMatch(/^data:image\/png/)
  }
})
