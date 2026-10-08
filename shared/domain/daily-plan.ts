import type { DailyEntry, DailyModuleId, Habit, MyhabitState, Task } from './types'
import { dayFor, habitsForDate, tasksForDate, taskDoneOn } from './habits'
import { clone, resolveModule } from './settings'
import { localDateKey, dateOffset, isDateKey } from './dates'

export const occurrenceId=(module:DailyModuleId,sourceId:string,date:string)=>`${module}:${sourceId}:${date}`
function scheduled(state:MyhabitState,module:DailyModuleId,date:string) {
  const config=resolveModule(state.settings,module,date)
  return config.inToday&&config.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())
}
function generate(state:MyhabitState,date:string):DailyEntry[] {
  const entries:DailyEntry[]=[]
  if(resolveModule(state.settings,'habits',date).inToday)for(const habit of habitsForDate(state,date))entries.push({id:occurrenceId('habits',habit.id,date),module:'habits',sourceId:habit.id,title:habit.title,time:habit.time,slot:habit.slot,originDate:date})
  if(resolveModule(state.settings,'tasks',date).inToday)for(const task of tasksForDate(state,date))entries.push({id:occurrenceId('tasks',task.id,date),module:'tasks',sourceId:task.id,title:task.title,time:task.time,originDate:date})
  if(scheduled(state,'focus',date)){const config=resolveModule(state.settings,'focus',date);entries.push({id:occurrenceId('focus','focus',date),module:'focus',sourceId:'focus',title:'focus',time:config.time,target:config.targetMinutes??25,originDate:date})}
  if(scheduled(state,'mood',date)){const config=resolveModule(state.settings,'mood',date);entries.push({id:occurrenceId('mood','mood',date),module:'mood',sourceId:'mood',title:'mood',time:config.time,originDate:date})}
  if(scheduled(state,'goals',date)){const config=resolveModule(state.settings,'goals',date);for(const id of config.goalIds??[]){const goal=state.goals.find(item=>item.id===id&&!item.archived);if(goal)entries.push({id:occurrenceId('goals',goal.id,date),module:'goals',sourceId:goal.id,title:goal.title,time:config.time,originDate:date})}}
  return entries
}
export function planForDate(state:MyhabitState,date:string) {
  const entries=clone(state.dailyPlans[date]?.entries??generate(state,date))
  for(const extra of state.dailyExtras[date]??[])if(!entries.some(item=>item.id===extra.id))entries.push(clone(extra))
  return entries.filter(entry=>{const override=state.dailyOverrides[entry.originDate]?.[entry.id];return !override?.movedTo||override.movedTo===date}).map(entry=>({...entry,...state.dailyOverrides[entry.originDate]?.[entry.id]}))
}
export function ensureDailyPlan(state:MyhabitState,date:string) {
  if(!state.dailyPlans[date]) {
    state.habitDays[date]??=clone(dayFor(state,date))
    state.dailyPlans[date]={entries:generate(state,date)}
    return true
  }
  return false
}
export function entryComplete(state:MyhabitState,entry:DailyEntry):boolean {
  const date=entry.originDate
  if(state.dailyOverrides[date]?.[entry.id]?.skipped)return false
  if(entry.module==='habits')return Boolean(state.habitDays[date]?.done[entry.sourceId])
  if(entry.module==='tasks'){const task=state.tasks.find(item=>item.id===entry.sourceId);return Boolean(task&&taskDoneOn(task,date))}
  if(entry.module==='mood')return state.moodEntries.some(item=>item.date===date)
  if(entry.module==='focus')return state.focusSessions.filter(item=>localDateKey(new Date(item.startedAt),state.settings.timezone)===date).reduce((sum,item)=>sum+item.minutes,0)>=(entry.target??25)
  return state.goalEntries.some(item=>item.goalId===entry.sourceId&&item.date===date)||state.financeEntries.some(item=>item.goalId===entry.sourceId&&item.date===date)
}
export function setDailyOverride(state:MyhabitState,entry:DailyEntry,change:{time?:string;skipped?:boolean}) {
  const date=entry.originDate
  state.dailyOverrides[date]??={}
  state.dailyOverrides[date][entry.id]={...state.dailyOverrides[date][entry.id],...change}
  if(entry.module==='habits'&&change.skipped!==undefined){const day=state.habitDays[date]??=dayFor(state,date);const skipped=new Set(day.skippedIds??[]);if(change.skipped)skipped.add(entry.sourceId);else skipped.delete(entry.sourceId);day.skippedIds=[...skipped]}
}
export function moveTaskOccurrence(state:MyhabitState,entry:DailyEntry,destination:string) {
  if(entry.module!=='tasks'||!isDateKey(destination))throw new RangeError('Invalid task destination')
  const previous=state.dailyOverrides[entry.originDate]?.[entry.id]?.movedTo
  if(previous)state.dailyExtras[previous]=(state.dailyExtras[previous]??[]).filter(item=>item.id!==entry.id)
  const overrides=state.dailyOverrides[entry.originDate]??={}
  overrides[entry.id]={...overrides[entry.id],movedTo:destination}
  if(destination!==entry.originDate){state.dailyExtras[destination]??=[];if(!state.dailyExtras[destination].some(item=>item.id===entry.id))state.dailyExtras[destination].push(clone(entry))}
}
export function saveHabitTemplate(state:MyhabitState,next:Habit,today:string) {
  const previous=state.habits.find(item=>item.id===next.id)
  const effectiveFrom=dateOffset(today,1)
  if(!previous){state.habits.push({...clone(next),startsOn:effectiveFrom});return}
  const fields=(habit:Habit)=>({title:habit.title,description:habit.description,time:habit.time??null,slot:habit.slot,active:habit.active,recurrence:habit.recurrence??null})
  const versions=clone(previous.versions??[{effectiveFrom:'0000-01-01',...fields(previous)}]).filter(item=>item.effectiveFrom!==effectiveFrom)
  versions.push({effectiveFrom,...fields(next)})
  Object.assign(previous,clone(next),{versions})
}
export function saveTaskTemplate(state:MyhabitState,next:Task,today:string) {
  const previous=state.tasks.find(item=>item.id===next.id)
  const effectiveFrom=dateOffset(today,1)
  if(!previous){state.tasks.push({...clone(next),date:next.recurrence&&next.date<effectiveFrom?effectiveFrom:next.date});return}
  const fields=(task:Task)=>({title:task.title,date:task.date,time:task.time??null,priority:task.priority,recurrence:task.recurrence??null,archived:task.archived??false})
  const versions=clone(previous.versions??[{effectiveFrom:'0000-01-01',...fields(previous)}]).filter(item=>item.effectiveFrom!==effectiveFrom)
  versions.push({effectiveFrom,...fields(next)})
  Object.assign(previous,clone(next),{versions})
}
export function addDayItem(state:MyhabitState,date:string,module:'habits'|'tasks',title:string,time:string,slot:Habit['slot']='morning') {
  const id=globalThis.crypto.randomUUID(),createdAt=new Date().toISOString()
  if(module==='habits') {
    const habit:Habit={id,title,time,slot,active:true,createdAt,onlyOn:date,startsOn:date}
    state.habits.push(habit)
    if(state.habitDays[date]){state.habitDays[date].habitIds.push(id);state.habitDays[date].habitSnapshots??=[];state.habitDays[date].habitSnapshots.push(clone(habit))}
  }else state.tasks.push({id,title,time,date,priority:resolveModule(state.settings,'tasks').defaultPriority??'med',status:'todo',subtasks:[],createdAt})
  const entry:DailyEntry={id:occurrenceId(module,id,date),sourceId:id,module,title,time,slot:module==='habits'?slot:undefined,originDate:date}
  state.dailyExtras[date]??=[];state.dailyExtras[date].push(entry)
  return entry
}

export function reminderGroups(state:MyhabitState,date:string,time:string) {
  const groups=new Map<string,DailyEntry[]>()
  for(const entry of planForDate(state,date)) {
    const config=resolveModule(state.settings,entry.module,date)
    const override=state.dailyOverrides[entry.originDate]?.[entry.id]
    const reminderTime=override?.time??config.reminderTime
    if(!config.remindersEnabled||entry.skipped||entryComplete(state,entry)||reminderTime>time)continue
    const group=groups.get(reminderTime)??[];group.push(entry);groups.set(reminderTime,group)
  }
  const finance=resolveModule(state.settings,'finance',date)
  if(finance.remindersEnabled&&finance.reminderTime<=time&&finance.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())&&!state.financeEntries.some(entry=>entry.date===date)) {
    const group=groups.get(finance.reminderTime)??[]
    group.push({id:`finance-reminder:${date}`,module:'tasks',sourceId:'finance-reminder',title:state.settings.language==='th'?'บันทึกการเงิน':'Record finances',originDate:date})
    groups.set(finance.reminderTime,group)
  }
  return groups
}
