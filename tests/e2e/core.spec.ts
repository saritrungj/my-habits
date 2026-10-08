import { expect, test } from '@playwright/test'

test('guest can check a habit and keep it after reload', async ({ page }) => {
  await page.goto('/today')
  const firstHabit = page.getByRole('checkbox').nth(0)
  await expect(page.getByRole('checkbox')).toHaveCount(6)
  await expect(firstHabit).toBeEnabled()
  await firstHabit.locator('..').click()
  await expect(firstHabit).toBeChecked()
  await expect.poll(() => page.evaluate(async () => {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('myhabit-v2', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return await new Promise<boolean>((resolve, reject) => {
      const request = db.transaction('snapshots').objectStore('snapshots').get('guest')
      request.onsuccess = () => resolve(Boolean(request.result?.state?.habitDays?.[day]?.done && Object.values(request.result.state.habitDays[day].done).some(Boolean)))
      request.onerror = () => reject(request.error)
    })
  })).toBe(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('checkbox').nth(0)).toBeChecked()
})

test('bill splitting keeps all satang and shows the adjusted total', async ({ page }) => {
  await page.goto('/tools/split-bill')
  await page.getByRole('spinbutton').first().fill('100.00')
  await page.getByRole('combobox', { name: /People|คน/ }).selectOption('3')
  await expect(page.getByText('฿33.34')).toBeVisible()
  await expect(page.getByText('฿100.00').last()).toBeVisible()
})

test('primary routes render without server errors', async ({ page }) => {
  for (const route of ['/', '/today', '/progress', '/tasks', '/goals', '/goals/missing', '/finance', '/focus', '/mood', '/settings', '/tools', '/tools/convert/length']) {
    const response = await page.goto(route)
    expect(response?.status(), `route ${route}`).toBe(200)
  }
})
