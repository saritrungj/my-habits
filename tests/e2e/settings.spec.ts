import { expect, test, type Page } from '@playwright/test'
import { defaultState } from '../../shared/domain/types'

import { seed } from './helpers'

const save=async(page:Page)=>{await page.getByRole('button',{name:/Save settings|บันทึกการตั้งค่า/}).click();await expect(page.getByRole('status').filter({hasText:/Saved|บันทึกแล้ว/})).toBeVisible()}
test('header theme switch stays in sync with saved preferences after reload',async({page})=>{
  const state=defaultState();state.settings.language='en';state.settings.theme='light';await seed(page,state)
  await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByRole('button',{name:'Switch to light theme',exact:true})).toBeEnabled()
  await page.reload()
  await expect(page.getByRole('button',{name:'Switch to light theme',exact:true})).toBeEnabled()
  await page.goto('/settings')
  await expect(page.getByRole('combobox',{name:'Theme',exact:true})).toHaveValue('dark')
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click()
  await expect(page.locator('html')).toHaveClass(/light/)
})
test('module shortcut and global form share overrides, cancel and reset',async({page})=>{
  const state=defaultState();state.settings.language='en';await seed(page,state)
  await page.goto('/focus');await page.getByRole('link',{name:'Module settings',exact:true}).click()
  await expect(page.getByRole('combobox',{name:'Module',exact:true})).toHaveValue('focus')
  await page.getByRole('checkbox',{name:'Focus minutes override',exact:true}).check()
  await page.getByLabel('Focus minutes',{exact:true}).fill('45');await save(page)
  await page.reload();await expect(page.getByLabel('Focus minutes',{exact:true})).toHaveValue('45')
  await page.getByLabel('Focus minutes',{exact:true}).fill('60');await page.getByRole('button',{name:'Cancel',exact:true}).click()
  await expect(page.getByLabel('Focus minutes',{exact:true})).toHaveValue('45')
  await page.getByRole('checkbox',{name:'Focus minutes override',exact:true}).uncheck();await save(page)
  await expect(page.getByLabel('Focus minutes',{exact:true})).toHaveValue('25');await expect(page.getByLabel('Focus minutes',{exact:true})).toBeDisabled()
})
test('date overrides and offline saves survive reload without changing tomorrow',async({page,context})=>{
  const state=defaultState();state.settings.language='en';await seed(page,state)
  await page.getByTestId('daily-plan-editor').locator('summary').click()
  await page.getByRole('checkbox',{name:'ตื่นตามเวลา skip',exact:true}).check()
  await page.getByLabel('Day item name').fill('One day only');await page.getByRole('button',{name:'Add to plan',exact:true}).click()
  await context.setOffline(true);await page.getByRole('button',{name:'Save day plan',exact:true}).click()
  await expect(page.getByRole('checkbox',{name:'One day only',exact:true})).toBeVisible()
  await expect.poll(()=>page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('myhabit-v2',1);r.onsuccess=()=>resolve(r.result)})
    return await new Promise<number>(resolve=>{const r=db.transaction('snapshots').objectStore('snapshots').get('guest');r.onsuccess=()=>resolve(r.result?.state?.tasks?.filter((t:any)=>t.title==='One day only').length??0)})
  })).toBe(1)
  await context.setOffline(false);await page.reload();await expect(page.getByRole('checkbox',{name:'One day only',exact:true})).toBeVisible()
  const current=await page.getByLabel('Plan date').inputValue();const key=current||await page.evaluate(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))
  const next=new Date(`${key}T12:00:00Z`);next.setUTCDate(next.getUTCDate()+1)
  await page.getByLabel('Plan date').fill(next.toISOString().slice(0,10))
  await expect(page.getByRole('checkbox',{name:'One day only',exact:true})).toHaveCount(0)
  await expect(page.getByRole('checkbox').first()).toBeDisabled() // future completions stay locked
})
test('light, dark and system share one theme preference and react to system changes',async({page})=>{
  const state=defaultState();state.settings.language='en';await page.emulateMedia({colorScheme:'dark'});await seed(page,state)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.goto('/settings');await page.getByLabel('Theme',{exact:true}).selectOption('dark');await save(page)
  await expect(page.locator('html')).toHaveClass(/dark/);await page.reload();await expect(page.getByLabel('Theme',{exact:true})).toHaveValue('dark')
  await page.getByLabel('Theme',{exact:true}).selectOption('light');await save(page);await expect(page.locator('html')).not.toHaveClass(/dark/)
})
test('focus survives a settings visit and records the original session duration',async({page})=>{
  const state=defaultState();state.settings.language='en';state.settings.modules.focus={inToday:true,focusMinutes:1,targetMinutes:1}
  await seed(page,state);await page.clock.install();await page.goto('/focus');await page.getByRole('button',{name:'Start',exact:true}).click()
  await page.clock.fastForward('00:10');await page.getByRole('link',{name:'Module settings',exact:true}).click()
  await page.getByLabel('Focus minutes',{exact:true}).fill('2');await save(page)
  await page.goBack();await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible()
  await page.clock.fastForward('00:51');await page.getByRole('link',{name:'myhabit',exact:true}).click()
  await expect(page.getByText('Focus for 1 minute', {exact:true}).locator('..').getByText('Done',{exact:true})).toBeVisible()
})
test('mood and financial goal check-ins complete from real records once',async({page})=>{
  const state=defaultState();state.settings.language='en';state.goals=[{id:'goal',title:'Travel fund',kind:'financial',target:5000,startingValue:0,unit:'THB',createdAt:new Date().toISOString()}]
  state.settings.modules.goals={inToday:true,goalIds:['goal']};state.settings.modules.mood={inToday:true}
  await seed(page,state);await page.goto('/goals/goal');await page.getByRole('spinbutton').fill('100');await page.getByRole('button',{name:'Add entry',exact:true}).click()
  await page.goto('/mood');await page.getByRole('button',{name:'Save',exact:true}).click();await page.goto('/today')
  await expect(page.getByText('Check in: Travel fund',{exact:true}).locator('..').getByText('Done',{exact:true})).toBeVisible()
  await expect(page.getByText('Check in with your mood',{exact:true}).locator('..').getByText('Done',{exact:true})).toBeVisible()
  await page.goto('/finance');await expect(page.getByText('+100.00',{exact:true})).toHaveCount(1)
})
test('tool defaults change real bill calculations and converter unit pairs',async({page})=>{
  const state=defaultState();state.settings.language='en';state.settings.modules.tools={peopleCount:4,serviceEnabled:true,serviceRate:.2,unitPairs:{length:{from:'km',to:'m'}}}
  await seed(page,state);await page.goto('/tools/split-bill');await page.getByRole('spinbutton').first().fill('100')
  await expect(page.getByText('฿30.00',{exact:true}).first()).toBeVisible();await expect(page.getByText('฿120.00',{exact:true}).last()).toBeVisible()
  await page.goto('/tools/convert/length');await expect(page.getByRole('combobox').first()).toHaveValue('km');await expect(page.getByRole('combobox').last()).toHaveValue('m')
})
test('settings can be saved with a keyboard and controls retain comfortable targets',async({page})=>{
  const state=defaultState();state.settings.language='en';await seed(page,state);await page.goto('/settings')
  const theme=page.getByLabel('Theme',{exact:true});await theme.focus();await theme.press('End');await theme.press('Tab')
  const button=page.getByRole('button',{name:'Save settings',exact:true});await button.focus()
  expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none')
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await button.press('Enter');await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({reducedMotion:'reduce'});await expect.poll(()=>button.evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThan(.001)
})
test('re-importing a v3 backup preserves one financial entry and recorded plans',async({page})=>{
  const state=defaultState();state.settings.language='en';state.financeEntries=[{id:'ledger',date:'2026-10-08',kind:'income',amountMinor:1234,currency:'THB'}]
  await seed(page,state)
  const file={name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'myhabit',version:3,state}))}
  await page.locator('input[type=file]').setInputFiles(file);await page.locator('input[type=file]').setInputFiles(file)
  await expect(page.getByRole('status').filter({hasText:/imported/i})).toBeVisible()
  await page.getByRole('link',{name:'Module settings',exact:true}).click();await page.getByRole('button',{name:'Data & account',exact:true}).click()
  await page.getByRole('button',{name:'Restore settings defaults',exact:true}).click();await save(page)
  await page.goto('/finance');await expect(page.getByText('+12.34',{exact:true})).toHaveCount(1)
})
