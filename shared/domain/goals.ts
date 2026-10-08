import type { Goal, MyhabitState } from './types'
export function goalCurrent(state: MyhabitState, goal: Goal): number {
  if (goal.kind === 'weight') return state.goalEntries.filter(row => row.goalId === goal.id).sort((a,b) => a.date.localeCompare(b.date)).at(-1)?.value ?? goal.startingValue
  return goal.startingValue + state.financeEntries.filter(row => row.goalId === goal.id && row.currency === goal.unit).reduce((sum,row) => sum + (row.kind === 'income' ? row.amountMinor : -row.amountMinor), 0) / 100
}
export function goalProgress(goal: Goal, current: number): number {
  const progress = goal.kind === 'weight' && goal.startingValue !== goal.target ? (current - goal.startingValue) / (goal.target - goal.startingValue) : current / goal.target
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0))
}
