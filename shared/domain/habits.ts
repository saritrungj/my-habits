import type { Habit, HabitDay, MyhabitState, Slot, Task } from './types'
import { localDateKey } from './dates'
import { resolveModule } from './settings'

export function habitAtDate(habit:Habit,date:string):Habit {
  const version=habit.versions?.filter(item=>item.effectiveFrom<=date).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1)
  return version?{...habit,...version,time:version.time??undefined,recurrence:version.recurrence??undefined}:habit
}

export function habitsForDate(state: MyhabitState, date: string): Habit[] {
  const plan = state.habitDays[date]?.habitIds
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  const today = localDateKey(new Date(), state.settings.timezone)
  const defaults=resolveModule(state.settings,'habits',date)
  if (!plan && date < today) return []
  const candidates = plan ? (state.habitDays[date]?.habitSnapshots ?? plan.map(id => state.habits.find(habit => habit.id === id)).filter((habit): habit is Habit => Boolean(habit))) : state.habits.map(habit=>habitAtDate(habit,date)).filter(habit => {
    const repeats=habit.onlyOn===date||(!habit.recurrence?defaults.weekdays.includes(weekday):habit.recurrence.type==='daily'||habit.recurrence.weekdays.includes(weekday))
    return habit.active&&(!habit.startsOn||habit.startsOn<=date)&&(!habit.onlyOn||habit.onlyOn===date)&&repeats
  })
  return candidates.filter(habit => habit.active || plan?.includes(habit.id)).map(habit=>({...habit,time:habit.time||defaults.time})).sort((a, b) => (['morning', 'afternoon', 'evening'] as Slot[]).indexOf(a.slot) - (['morning', 'afternoon', 'evening'] as Slot[]).indexOf(b.slot))
}

export function dayFor(state: MyhabitState, date: string): HabitDay {
  const previous = state.habitDays[date]
  const planned = habitsForDate(state, date).map(habit => habit.id)
  return previous ? { ...previous, habitIds: [...previous.habitIds], done: { ...previous.done } } : { habitIds: planned, habitSnapshots:habitsForDate(state,date).map(habit=>({...habit})), done: {}, threshold: Math.min(resolveModule(state.settings,'habits',date).passThreshold??state.settings.passThreshold, planned.length), rest: false }
}

export function taskAtDate(task:Task,date:string):Task {
  const version=task.versions?.filter(item=>item.effectiveFrom<=date).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1)
  return version?{...task,...version,time:version.time??undefined,recurrence:version.recurrence??undefined}:task
}
export function tasksForDate(state: MyhabitState, date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  return state.tasks.map(task=>taskAtDate(task,date)).filter(task => {
    if(task.archived)return false
    if (!task.recurrence) return task.date === date
    if (task.recurrence.type === 'daily') return task.date <= date
    return task.recurrence.weekdays.includes(weekday) && task.date <= date
  })
}

export function taskDoneOn(task: MyhabitState['tasks'][number], date: string) {
  return taskAtDate(task,date).recurrence ? Boolean(task.completedDates?.includes(date)) : task.status === 'done'
}

export function passed(day: HabitDay): boolean {
  if (day.rest) return true
  const total = day.habitIds.length
  if (total === 0) return false
  return day.habitIds.filter(id => day.done[id]&&!day.skippedIds?.includes(id)).length >= Math.max(1, Math.min(total, day.threshold))
}

export function streak(state: MyhabitState, endDate: string): number {
  let cursor = endDate
  if (!state.habitDays[cursor] || !passed(dayFor(state, cursor))) cursor = offset(cursor, -1)
  let count = 0
  for (let i = 0; i < 3660; i++) {
    const record = state.habitDays[cursor]
    if (!record || !passed(record)) break
    count++
    cursor = offset(cursor, -1)
  }
  return count
}

function offset(date: string, n: number): string {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number)
  const value = new Date(Date.UTC(y, m - 1, d + n, 12))
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
}

export function addHabit(state: MyhabitState, habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
  const id = globalThis.crypto?.randomUUID?.() ?? `habit-${Date.now()}`
  const next = { ...habit, id, createdAt: new Date().toISOString() }
  state.habits.push(next)
  return next
}
