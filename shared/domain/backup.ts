import type { MyhabitState } from './types'
import { clone } from './settings'

function mergeIds<T extends {id:string}>(current:T[],incoming:T[],preferIncoming=false):T[] {
  const records=new Map<string,T>()
  for(const item of preferIncoming?[...current,...incoming]:[...incoming,...current])records.set(item.id,clone(item))
  return [...records.values()]
}
function mergeDays<T>(current:Record<string,Record<string,T>>,incoming:Record<string,Record<string,T>>) {
  return Object.fromEntries([...new Set([...Object.keys(incoming),...Object.keys(current)])].map(date=>[date,{...incoming[date],...current[date]}]))
}
/** Import adds missing records; existing ledger IDs and recorded day snapshots win. */
export function mergeWorkspaceBackup(current:MyhabitState,incoming:MyhabitState,preferences=false):MyhabitState {
  const result=clone(current)
  result.habits=mergeIds(current.habits,incoming.habits,preferences)
  result.tasks=mergeIds(current.tasks,incoming.tasks)
  result.goals=mergeIds(current.goals,incoming.goals)
  result.goalEntries=mergeIds(current.goalEntries,incoming.goalEntries)
  result.financeEntries=clone(current.financeEntries)
  for(const entry of incoming.financeEntries)if(!result.financeEntries.some(saved=>saved.id===entry.id||entry.sourceKey&&saved.sourceKey===entry.sourceKey))result.financeEntries.push(clone(entry))
  result.focusSessions=mergeIds(current.focusSessions,incoming.focusSessions)
  result.billDrafts=mergeIds(current.billDrafts,incoming.billDrafts)
  result.moodEntries=[...new Map([...incoming.moodEntries,...current.moodEntries].map(item=>[item.date,clone(item)])).values()]
  result.settings=clone(preferences?incoming.settings:current.settings)
  result.habitDays={...clone(incoming.habitDays),...clone(current.habitDays)}
  for(const [date,day] of Object.entries(incoming.habitDays)) {
    const saved=current.habitDays[date]
    if(saved)result.habitDays[date]={...clone(day),...clone(saved),habitIds:[...new Set([...day.habitIds,...saved.habitIds])],done:{...day.done,...saved.done},habitSnapshots:mergeIds(saved.habitSnapshots??[],day.habitSnapshots??[]),skippedIds:[...new Set([...day.skippedIds??[],...saved.skippedIds??[]])]}
  }
  result.dailyPlans={...clone(incoming.dailyPlans),...clone(current.dailyPlans)}
  result.dailyOverrides=mergeDays(current.dailyOverrides,incoming.dailyOverrides)
  result.dailyExtras={...clone(incoming.dailyExtras),...clone(current.dailyExtras)}
  for(const [date,entries] of Object.entries(incoming.dailyExtras))result.dailyExtras[date]=mergeIds(current.dailyExtras[date]??[],entries)
  result.dayNotes={...incoming.dayNotes,...current.dayNotes}
  result.doneAt=mergeDays(current.doneAt,incoming.doneAt)
  result.subtasksDone=mergeDays(current.subtasksDone,incoming.subtasksDone)
  result.legacySources={...incoming.legacySources,...current.legacySources}
  result.migrationWarnings=[...new Set([...current.migrationWarnings,...incoming.migrationWarnings])]
  return result
}
