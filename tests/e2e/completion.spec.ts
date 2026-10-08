import { expect, test } from '@playwright/test'
import { defaultState } from '../../shared/domain/types'
import { seed } from './helpers'

const english = () => { const state = defaultState(); state.settings.language = 'en'; state.settings.theme = 'light'; return state }
const rates = { base: 'EUR', provider: 'ECB', date: '2026-10-07', fetchedAt: '2026-10-08T00:00:00Z', rates: { EUR: 1, THB: 40, USD: 1.2, JPY: 160, GBP: .8 } }

test('currency loads verified rates, swaps units and clears outdated results', async ({ page }) => {
  await page.route('**/api/exchange-rates', route => route.fulfill({ json: rates }))
  await seed(page, english()); await page.goto('/tools/convert/currency')
  await expect(page.getByText(/Reference rates dated/)).toContainText('2026-10-07')
  await page.getByLabel('Amount', { exact: true }).fill('400')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.locator('.conversion-result')).toHaveText('12USD')
  await page.getByRole('button', { name: 'Swap units' }).click()
  await expect(page.locator('.conversion-result')).toHaveCount(0)
  await page.getByLabel('Amount', { exact: true }).fill('12')
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.locator('.conversion-result')).toHaveText('400THB')
  await page.route('**/api/exchange-rates', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }))
  await page.reload()
  await expect(page.getByText(/Using saved rates/)).toBeVisible()
  await page.getByRole('button', { name: 'Convert', exact: true }).click()
  await expect(page.locator('.conversion-result')).toBeVisible()
})

test('currency failure offers a working retry rather than invented prices', async ({ page }) => {
  await page.route('**/api/exchange-rates', route => route.fulfill({ status: 503, json: {} }))
  await seed(page, english()); await page.goto('/tools/convert/currency')
  await expect(page.getByRole('alert')).toHaveText(/Rates could not load/)
  await expect(page.getByRole('button', { name: 'Convert', exact: true })).toBeDisabled()
  await page.route('**/api/exchange-rates', route => route.fulfill({ json: rates }))
  await page.getByRole('button', { name: 'Refresh rates' }).click()
  await expect(page.getByRole('button', { name: 'Convert', exact: true })).toBeEnabled()
})

test('finance edits one entry, isolates currencies, deletes and restores with undo', async ({ page }) => {
  await seed(page, english()); await page.goto('/finance')
  await page.getByLabel('Amount · THB').fill('100')
  await page.getByLabel('Category', { exact: true }).fill('Lunch')
  await page.getByRole('button', { name: 'Add entry', exact: true }).click()
  await expect(page.locator('.record-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Edit entry', exact: true }).click()
  await page.getByLabel('Amount · THB').fill('75')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.locator('.record-row')).toHaveCount(1)
  await expect(page.locator('.record-row')).toContainText('−75.00')
  await page.getByRole('combobox', { name: 'Currency', exact: true }).selectOption('USD')
  await page.getByLabel('Amount · USD').fill('200')
  await page.getByRole('button', { name: 'Add entry', exact: true }).click()
  await expect(page.getByText('This month’s net · THB').locator('..')).toContainText('-75.00')
  await page.locator('.record-row').first().getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.locator('.record-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.locator('.record-row')).toHaveCount(2)
  await page.reload(); await expect(page.locator('.record-row')).toHaveCount(2)
})

test('weight goals measure change from starting weight and restore archived goals', async ({ page }) => {
  const state = english(); state.goals = [{ id: 'weight', title: 'Feel stronger', kind: 'weight', startingValue: 80, target: 60, unit: 'kg', createdAt: new Date().toISOString() }]
  await seed(page, state); await page.goto('/goals/weight')
  await page.getByRole('spinbutton').fill('75'); await page.getByRole('button', { name: 'Add entry', exact: true }).click()
  await page.getByRole('button', { name: 'Edit record' }).click()
  await page.getByRole('spinbutton').fill('70'); await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Edit record' })).toHaveCount(1)
  await page.goto('/goals'); await expect(page.getByRole('progressbar', { name: 'Feel stronger' })).toHaveAttribute('aria-valuenow', '50')
  await page.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await page.locator('summary').filter({ hasText: 'Archived goals' }).click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
})

test('mood dates have separate forms and removed check-ins can be restored', async ({ page }) => {
  const state = english(); state.moodEntries = [{ date: '2026-10-07', mood: 'happy', energy: 4, gratitude: 'A good walk', vent: 'Older thoughts' }]
  await seed(page, state); await page.goto('/mood?date=2026-10-07')
  await expect(page.getByLabel('What is on your mind? (optional)')).toHaveValue('Older thoughts')
  await page.goto('/mood?date=2026-10-06'); await expect(page.getByLabel('What is on your mind? (optional)')).toHaveValue('')
  await page.getByLabel('What is on your mind? (optional)').fill('A different day')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Remove check-in' }).first().click()
  await expect(page.getByRole('button', { name: 'Remove check-in' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remove check-in' })).toHaveCount(2)
})

test('focus restores a running or paused clock after reload and completes only once', async ({ page }) => {
  const state = english(); state.settings.modules.focus = { focusMinutes: 1 }
  await seed(page, state); await page.clock.install(); await page.goto('/focus')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.clock.fastForward('00:10'); await page.reload()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const paused = await page.locator('.focus-clock strong').textContent()
  await page.clock.fastForward('00:20'); await page.reload()
  await expect(page.locator('.focus-clock strong')).toHaveText(paused!)
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.clock.fastForward('00:51')
  await expect(page.getByText('Total sessions', { exact: true }).locator('..').locator('strong')).toHaveText('1')
  await page.reload(); await expect(page.getByText('Total sessions', { exact: true }).locator('..').locator('strong')).toHaveText('1')
})

test('installed app reloads and navigates offline while caching no personal pages', async ({ page, context }) => {
  test.setTimeout(60_000)
  await seed(page, english())
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })) })
  const cached = await page.evaluate(async () => (await Promise.all((await caches.keys()).filter(key => key.startsWith('myhabit-shell-')).map(async key => (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)))).flat())
  expect(cached).toContain('/offline-shell'); expect(cached).not.toContain('/today'); expect(cached.some(path => path.startsWith('/api/') || path.startsWith('/auth/'))).toBe(false)
  await context.setOffline(true)
  await page.reload(); await expect(page.getByRole('checkbox').first()).toBeEnabled()
  await page.goto('/tasks'); await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('tasks keep subtask edits, undo removals and restore from the archive', async ({ page }) => {
  const state = english(); state.tasks = [{ id: 'task', title: 'Prepare notes', date: '2026-10-08', status: 'todo', priority: 'med', subtasks: [{ id: 'draft', title: 'First draft', done: false }], createdAt: new Date().toISOString() }]
  await seed(page, state); await page.goto('/tasks')
  await page.getByRole('checkbox', { name: 'First draft', exact: true }).check()
  await page.getByRole('button', { name: 'Remove subtask' }).click()
  await expect(page.getByLabel('Subtask name')).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'First draft', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Archive task' }).click()
  await page.locator('summary').filter({ hasText: 'Archived tasks' }).click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.reload(); await expect(page.getByRole('checkbox', { name: 'First draft', exact: true })).toBeChecked()
})

test('weighted bill drafts survive reload and support removal with undo', async ({ page }) => {
  await seed(page, english()); await page.goto('/tools/split-bill')
  await page.getByRole('spinbutton').first().fill('90')
  await page.locator('summary').filter({ hasText: 'Names and share weights' }).click()
  await page.getByRole('spinbutton', { name: 'สัดส่วนคนที่ 1' }).fill('2')
  await expect(page.getByText('฿60.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save bill on this device', exact: true }).click()
  await page.reload()
  await expect(page.getByText('฿60.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remove bill' }).click()
  await expect(page.getByRole('heading', { name: 'Bills saved on this device' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Remove bill' })).toHaveCount(1)
})
