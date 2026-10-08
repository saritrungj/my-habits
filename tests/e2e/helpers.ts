import { expect, type Page } from '@playwright/test'
import { defaultState } from '../../shared/domain/types'

export async function seed(page:Page,state=defaultState()){
  await page.goto('/today')
  await expect(page.getByRole('checkbox').first()).toBeEnabled()
  // Unload the app before seeding so its pending autosaves cannot replace the fixture.
  await page.goto('/icon.svg')
  await page.evaluate(async state=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('myhabit-v2',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put({key:'guest',state,revision:0,savedAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
    db.close()
  },state)
  await page.goto('/today');await expect(page.getByRole('checkbox').first()).toBeEnabled()
}
