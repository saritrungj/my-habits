import { defaultState, type BillDraft, type FinanceEntry, type Goal, type GoalEntry, type Habit, type HabitDay, type MyhabitState, type Task } from './types'
import { normalizeWorkspace } from './settings'

type RecordLike = Record<string, any>
const object = (value: unknown): RecordLike => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : {}
const id = () => globalThis.crypto?.randomUUID?.() ?? `mh-${Date.now()}-${Math.random().toString(36).slice(2)}`
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const slot = (value: unknown): Habit['slot'] => value === 'morning' || value === 'evening' ? value : 'afternoon'

export async function decryptLegacyBill(cipherText: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(cipherText), char => char.charCodeAt(0))
    if (combined.length < 29) return null
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode('han-tao-gun-secure-key-2025'), 'PBKDF2', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('han-tao-gun-salt'), iterations: 100000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: combined.slice(0, 12) }, key, combined.slice(12))
    return new TextDecoder().decode(plain)
  } catch { return null }
}

export async function importLegacy(input: unknown, options: { localHabits?: string | null; oldBill?: { value: string; encrypted: boolean } | null } = {}): Promise<MyhabitState> {
  const root = object(input)
  const state = defaultState()
  const warnings: string[] = []
  const sourceState = root.app === 'sprout-planner' || root.app === 'myhabit' ? object(root.state) : root
  if(sourceState.schemaVersion!==undefined&&![2,3].includes(sourceState.schemaVersion))throw new RangeError('Unsupported backup version')
  const oldDates = object(root.habitDays ?? root.days)
  const habitSnapshot = options.localHabits ? parseObject(options.localHabits) : null
  if (habitSnapshot) Object.assign(oldDates, habitSnapshot)

  if ([2,3].includes(sourceState.schemaVersion) && Array.isArray(sourceState.habits)) return normalizeWorkspace(sourceState)
  if (root.app === 'sprout-planner' || sourceState.tasks || sourceState.months) {
    const oldTasks = object(sourceState.tasks)
    const goalTasks = new Set<string>()
    const taskMap = new Map<string, string>()
    const habitMap = new Map<string, string>()
    const goalMap = new Map<string, Goal>()
    for (const [legacyId, rawValue] of Object.entries(oldTasks)) {
      const raw = object(rawValue)
      if (raw.goalType || raw.goalConfig) {
        const kind = raw.goalType === 'weight' ? 'weight' : 'financial'
        const goal: Goal = { id: `sprout-goal:${legacyId}`, title: String(raw.goalTitle ?? raw.title ?? 'เป้าหมาย').replace(/^\[.*?\]\s*/, ''), kind, target: finite(raw.goalConfig?.target ?? raw.goalTarget, 0), startingValue: finite(raw.goalConfig?.startingBalance ?? raw.goalConfig?.start, 0), unit: kind === 'weight' ? 'kg' : 'THB', createdAt: String(raw.createdAt ?? new Date().toISOString()) }
        state.goals.push(goal); goalTasks.add(legacyId); goalMap.set(legacyId, goal)
        continue
      }
      if (raw.isTemplate || raw.recurrence) {
        const habit: Habit = { id: legacyId, title: String(raw.title ?? 'กิจวัตร'), slot: slot(raw.slot), active: true, createdAt: String(raw.createdAt ?? new Date().toISOString()), legacy: true, ...(raw.recurrence ? { recurrence: raw.recurrence } : {}) }
        state.habits.push(habit); habitMap.set(legacyId, habit.id)
      } else {
        const task: Task = { id: `sprout-task:${legacyId}`, legacyId, title: String(raw.title ?? 'งาน'), date: '', status: raw.workStatus === 'done' ? 'done' : raw.workStatus === 'in-progress' ? 'in-progress' : 'todo', priority: raw.priority === 'high' || raw.priority === 'low' ? raw.priority : 'med', category: raw.category === 'work' ? 'work' : 'self-dev', subtasks: Array.isArray(raw.subtasks) ? raw.subtasks.map((sub: RecordLike) => ({ id: String(sub.id ?? id()), title: String(sub.title ?? ''), done: false })) : [], ...(raw.recurrence ? { recurrence: raw.recurrence } : {}), createdAt: String(raw.createdAt ?? new Date().toISOString()) }
        state.tasks.push(task); taskMap.set(legacyId, task.id)
      }
    }
    const oldDays = object(sourceState.days)
    for (const [date, value] of Object.entries(oldDays)) {
      if (!validDate(date)) { warnings.push(`ข้ามวันที่ไม่ถูกต้อง: ${date}`); continue }
      const old = object(value)
      const done: Record<string, boolean> = {}
      const legacyDone = object(old.done)
      for (const [taskId, complete] of Object.entries(legacyDone)) {
        const mapped = habitMap.get(taskId)
        if (mapped && complete) done[mapped] = true
        const mappedTask = taskMap.get(taskId)
        const task = state.tasks.find(item => item.id === mappedTask)
        if (task && complete) {
          if (task.recurrence) task.completedDates = [...new Set([...(task.completedDates ?? []), date])]
          else { task.status = 'done'; if (!task.date) task.date = date }
        }
      }
      const legacyPlan = Array.isArray(old.taskIds) ? old.taskIds : Array.isArray(old.addonTaskIds) ? old.addonTaskIds : []
      const habitIds = [...new Set(legacyPlan.map(String).map(key => habitMap.get(key)).filter((key): key is string => Boolean(key)))]
      for (const legacyTaskId of legacyPlan.map(String)) {
        const task = state.tasks.find(item => item.id === taskMap.get(legacyTaskId))
        if (task && !task.date) task.date = date
      }
      if (habitIds.length || Object.keys(done).length) state.habitDays[date] = { habitIds: habitIds.length ? habitIds : Object.keys(done), done, threshold: Math.min(4, Math.max(1, habitIds.length || Object.keys(done).length)), rest: Boolean(old.skipped), updatedAt: old.updatedAt }
      if (typeof old.note === 'string' && old.note) state.dayNotes[date]=old.note
      if (old.subtasksDone && typeof old.subtasksDone === 'object') state.subtasksDone[date]=object(old.subtasksDone) as Record<string,Record<string,boolean>>
      if (old.doneAt && typeof old.doneAt === 'object') state.doneAt[date]=object(old.doneAt) as Record<string,string>
      const legacyGoalRecords = object(old.goalRecords)
      for (const [goalTaskId, recordValue] of Object.entries(legacyGoalRecords)) {
        const record = object(recordValue)
        const linked = goalMap.get(goalTaskId)
        if (!linked) continue
        if (record.type === 'weight' && Number.isFinite(Number(record.value))) state.goalEntries.push({ id: `sprout-goal-entry:${goalTaskId}:${date}`, goalId: linked.id, date, value: Number(record.value), note: typeof record.note === 'string' ? record.note : undefined })
        if (record.type === 'financial') importFinancialRecord(state, linked, date, record)
      }
      for (const [goalTaskId, valueAmount] of Object.entries(object(old.goalEntries))) {
        const goal = goalMap.get(goalTaskId)
        // Sprout treats goalRecords as the canonical format and goalEntries as
        // a compatibility fallback. Importing both would count the same day twice.
        if (legacyGoalRecords[goalTaskId]) continue
        if (goal && Number.isFinite(Number(valueAmount))) {
          if (goal.kind === 'financial') importFinancialRecord(state, goal, date, { income: Number(valueAmount) })
          else state.goalEntries.push({ id: `sprout-goal-entry:${goalTaskId}:${date}`, goalId: goal.id, date, value: Number(valueAmount) })
        }
      }
    }
    const templates = Array.isArray(sourceState.templates) ? sourceState.templates.map(String) : []
    for (const monthPlan of Object.values(object(sourceState.months))) {
      for (const taskId of Array.isArray(object(monthPlan).mainTaskIds) ? object(monthPlan).mainTaskIds : []) if (!templates.includes(String(taskId))) templates.push(String(taskId))
    }
    for (const template of templates) {
      if (!habitMap.has(template) && oldTasks[template]) {
        const raw = object(oldTasks[template]); const habit: Habit = { id: template, title: String(raw.title ?? 'กิจวัตร'), slot: slot(raw.slot), active: true, createdAt: String(raw.createdAt ?? new Date().toISOString()), legacy: true }
        state.habits.push(habit); habitMap.set(template, template)
      }
    }
    const settings = object(sourceState.settings)
    if (settings.language === 'th' || settings.language === 'en') state.settings.language = settings.language
    if (settings.theme === 'dark' || settings.theme === 'light') state.settings.theme = settings.theme
    if (Array.isArray(sourceState.focusSessions)) state.focusSessions = sourceState.focusSessions.filter((item: unknown) => object(item).startedAt && object(item).endedAt).map((item: unknown) => ({ ...object(item), id: String(object(item).id ?? id()) })) as MyhabitState['focusSessions']
    for (const [date, entry] of Object.entries(object(sourceState.moodLogs))) {
      const mood = object(entry)
      if (validDate(date) && ['happy', 'calm', 'tired', 'sad', 'stressed'].includes(mood.mood)) state.moodEntries.push({ date, mood: mood.mood, energy: finite(mood.energy, 3), gratitude: typeof mood.gratitude === 'string' ? mood.gratitude : undefined, vent: typeof mood.vent==='string'?mood.vent:undefined })
    }
    const reminders=object(settings.reminders)
    state.settings.remindersEnabled=Boolean(reminders.enabled)
    if(typeof reminders.time==='string'&&/^\d{2}:\d{2}$/.test(reminders.time))state.settings.reminderTime=reminders.time
    state.legacySources.sprout = { importedAt:new Date().toISOString(), taskCount:Object.keys(oldTasks).length, dayCount:Object.keys(oldDays).length }
  }

  for (const [date, value] of Object.entries(oldDates)) {
    if (!validDate(date) || !value || typeof value !== 'object') continue
    const old = object(value)
    const done = old.done && typeof old.done === 'object' ? Object.fromEntries(Object.entries(old.done).map(([key, val]) => [key, Boolean(val)])) : Object.fromEntries(Object.entries(old).map(([key, val]) => [key, Boolean(val)]))
    const habitIds = state.habits.filter(habit => done[habit.id] !== undefined).map(habit => habit.id)
    if (habitIds.length) state.habitDays[date] = { habitIds, done, threshold: 4, rest: false }
  }

  const oldBill = options.oldBill
  if (oldBill) {
    let value = oldBill.value
    if (oldBill.encrypted) {
      const decrypted = await decryptLegacyBill(value)
      if (decrypted) value = decrypted
      else warnings.push('อ่านบิลเก่าที่เข้ารหัสไม่ได้ ข้อมูลต้นฉบับยังไม่ถูกแก้ไข')
    }
    const bill = parseObject(value)
    if (bill && Date.now() - Number(bill.timestamp ?? 0) <= 3 * 60 * 60 * 1000) {
      const amountMinor = Math.round(finite(bill.billAmount, 0) * 100)
      if (amountMinor >= 0) {
        const draft: BillDraft = { id: `legacy-bill:${bill.timestamp}`, title: 'บิลที่นำเข้า', amountMinor, serviceRate: bill.includeServiceCharge ? .1 : 0, vatRate: bill.includeVAT ? .07 : 0, createdAt: new Date(Number(bill.timestamp)).toISOString(), people: Array.isArray(bill.people) ? bill.people.slice(0, 50).map((person: RecordLike) => ({ id: String(person.id ?? id()), name: String(person.name ?? '').slice(0, 50), amountMinor: Math.max(0, Math.round(finite(person.amount, 0) * 100)) })) : [] }
        state.billDrafts.push(draft)
      }
    } else if (bill) warnings.push('บิลในอุปกรณ์หมดอายุแล้ว ระบบไม่ได้ย้ายบิลนี้; ข้อมูลเดิมยังอยู่จนกว่าคุณจะล้างเอง')
  }
  state.migrationWarnings = warnings
  state.legacySources.imported = { format: root.app ?? (root.tasks ? 'sprout' : 'myhabit'), importedAt: new Date().toISOString() }
  return normalizeWorkspace(state)
}

function importFinancialRecord(state: MyhabitState, goal: Goal, date: string, record: RecordLike) {
  const income = Math.max(0, Math.round(finite(record.income, 0) * 100))
  const expense = Math.max(0, Math.round(finite(record.expense, 0) * 100))
  if (income) state.financeEntries.push({ id: id(), goalId: goal.id, date, kind: 'income', amountMinor: income, currency: 'THB', note: typeof record.note === 'string' ? record.note : undefined, sourceKey: `sprout:${goal.id}:${date}:income` })
  if (expense) state.financeEntries.push({ id: id(), goalId: goal.id, date, kind: 'expense', amountMinor: expense, currency: 'THB', note: typeof record.note === 'string' ? record.note : undefined, sourceKey: `sprout:${goal.id}:${date}:expense` })
}

function parseObject(value: string): RecordLike | null {
  try { return object(JSON.parse(value)) } catch { return null }
}
function finite(value: unknown, fallback: number): number { const number = Number(value); return Number.isFinite(number) ? number : fallback }
