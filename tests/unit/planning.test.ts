import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultState } from '../../shared/domain/types'
import { clone, normalizeWorkspace, resolveModule, saveSettings, validateSettings } from '../../shared/domain/settings'
import { dayFor, habitsForDate, passed } from '../../shared/domain/habits'
import { addDayItem, ensureDailyPlan, entryComplete, moveTaskOccurrence, planForDate, reminderGroups, saveHabitTemplate, saveTaskTemplate, setDailyOverride } from '../../shared/domain/daily-plan'
import { importLegacy } from '../../shared/domain/migrate'
import { dateLabel, isDateKey, localDateKey } from '../../shared/domain/dates'
import { mergeWorkspaceBackup } from '../../shared/domain/backup'
const today='2026-10-08',tomorrow='2026-10-09'
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-08T05:00:00Z'))})
afterEach(()=>vi.useRealTimers())
describe('settings and daily scheduling',()=>{
 it('versions task schedule edits for tomorrow and keeps recorded completions',()=>{
  const state=defaultState();state.tasks=[{id:'task',title:'Write',date:today,recurrence:{type:'daily'},priority:'med',subtasks:[],status:'todo',completedDates:[today],createdAt:today}]
  ensureDailyPlan(state,today);const original=planForDate(state,today).find(row=>row.module==='tasks')!
  saveTaskTemplate(state,{...state.tasks[0]!,title:'New title',recurrence:undefined},today)
  expect(planForDate(state,today).find(row=>row.module==='tasks')?.title).toBe('Write')
  expect(entryComplete(state,original)).toBe(true);expect(planForDate(state,tomorrow).some(row=>row.module==='tasks')).toBe(false)
  saveTaskTemplate(state,{id:'new',title:'New routine',date:today,recurrence:{type:'daily'},priority:'med',subtasks:[],status:'todo',createdAt:today},today)
  expect(state.tasks.at(-1)?.date).toBe(tomorrow)
 })
 it('inherits module schedules only when a habit has no item override',()=>{
  const state=defaultState();state.settings.modules.habits={weekdays:[5],time:'10:00'}
  state.habits.push({id:'inherited',title:'Learn',slot:'morning',active:true,createdAt:today})
  expect(habitsForDate(state,today).some(h=>h.id==='inherited')).toBe(false)
  expect(habitsForDate(state,tomorrow).find(h=>h.id==='inherited')?.time).toBe('10:00')
  expect(habitsForDate(state,today)).toHaveLength(6)
  saveHabitTemplate(state,{...state.habits.at(-1)!,recurrence:{type:'daily'}},today)
  expect(habitsForDate(state,today).some(h=>h.id==='inherited')).toBe(false)
  expect(habitsForDate(state,tomorrow).some(h=>h.id==='inherited')).toBe(true)
 })
 it('inherits global values, overrides only selected fields and resets to global',()=>{
  const state=defaultState();state.settings.dailyDefaults.time='09:00';state.settings.focusMinutes=45
  expect(resolveModule(state.settings,'focus').focusMinutes).toBe(45)
  state.settings.modules.focus={time:'10:00',focusMinutes:30}
  expect(resolveModule(state.settings,'focus')).toMatchObject({time:'10:00',focusMinutes:30,breakMinutes:5})
  delete state.settings.modules.focus.focusMinutes
  expect(resolveModule(state.settings,'focus').focusMinutes).toBe(45)
 })
 it('applies schedule changes tomorrow while preserving today’s threshold and snapshots',()=>{
  const state=defaultState();ensureDailyPlan(state,today)
  const settings=clone(state.settings);settings.passThreshold=1;settings.modules.mood={inToday:true,weekdays:[5],time:'18:00'}
  saveSettings(state,settings,today)
  expect(dayFor(state,today).threshold).toBe(4)
  expect(dayFor(state,tomorrow).threshold).toBe(1)
  expect(planForDate(state,today).some(entry=>entry.module==='mood')).toBe(false)
  expect(planForDate(state,tomorrow).find(entry=>entry.module==='mood')?.time).toBe('18:00')
  const habit=state.habits[0]!
  saveHabitTemplate(state,{...habit,title:'New title',active:false},today)
  expect(habitsForDate(state,today).find(item=>item.id===habit.id)?.title).toBe(habit.title==='New title'?'เข้านอนตรงเวลา':habit.title)
  expect(habitsForDate(state,tomorrow).some(item=>item.id===habit.id)).toBe(false)
 })
 it('adds only on the selected day and preserves completion when skip is undone',()=>{
  const state=defaultState();ensureDailyPlan(state,today)
  const entry=addDayItem(state,today,'habits','Read','19:00')
  expect(planForDate(state,tomorrow).some(row=>row.id===entry.id)).toBe(false)
  state.habitDays[today]!.done[entry.sourceId]=true;state.habitDays[today]!.threshold=1
  expect(passed(state.habitDays[today]!)).toBe(true)
  setDailyOverride(state,entry,{skipped:true,time:'20:00'})
  expect(entryComplete(state,entry)).toBe(false)
  expect(passed(state.habitDays[today]!)).toBe(false)
  setDailyOverride(state,entry,{skipped:false})
  expect(entryComplete(state,entry)).toBe(true)
 })
 it('moves a recurring occurrence once and retains its completion identity',()=>{
  const state=defaultState();state.tasks.push({id:'task',title:'Write',date:today,recurrence:{type:'daily'},priority:'med',subtasks:[],status:'todo',createdAt:today})
  ensureDailyPlan(state,today);const entry=planForDate(state,today).find(row=>row.module==='tasks')!
  moveTaskOccurrence(state,entry,tomorrow);moveTaskOccurrence(state,entry,tomorrow)
  expect(planForDate(state,today).some(row=>row.id===entry.id)).toBe(false)
  expect(planForDate(state,tomorrow).filter(row=>row.id===entry.id)).toHaveLength(1)
  state.tasks[0]!.completedDates=[today]
  expect(entryComplete(state,entry)).toBe(true)
  expect(entryComplete(state,planForDate(state,tomorrow).find(row=>row.originDate===tomorrow&&row.module==='tasks')!)).toBe(false)
 })
 it('derives goal/mood/focus completion from records without creating duplicate records',()=>{
  const state=defaultState();state.goals.push({id:'goal',title:'Save',kind:'financial',target:100,startingValue:0,unit:'THB',createdAt:today})
  state.settings.modules.goals={inToday:true,goalIds:['goal']};state.settings.modules.mood={inToday:true};state.settings.modules.focus={inToday:true,targetMinutes:25}
  const entries=planForDate(state,today)
  state.financeEntries.push({id:'money',goalId:'goal',date:today,kind:'income',amountMinor:1000,currency:'THB'})
  state.moodEntries.push({date:today,mood:'calm',energy:3})
  state.focusSessions.push({id:'session',startedAt:'2026-10-07T18:00:00Z',endedAt:'2026-10-07T18:25:00Z',minutes:25})
  for(const module of ['goals','mood','focus'])expect(entryComplete(state,entries.find(row=>row.module===module)!)).toBe(true)
  expect(state.financeEntries).toHaveLength(1);expect(state.moodEntries).toHaveLength(1)
 })
 it('groups reminders by effective time and excludes completed/skipped items',()=>{
  const state=defaultState();state.settings.remindersEnabled=true;state.settings.modules.finance={remindersEnabled:false}
  const entries=planForDate(state,today);ensureDailyPlan(state,today)
  state.habitDays[today]!.done[entries[0]!.sourceId]=true;setDailyOverride(state,entries[1]!,{skipped:true})
  expect(reminderGroups(state,today,'19:00').size).toBe(0)
  const groups=reminderGroups(state,today,'20:00');expect(groups.size).toBe(1);expect(groups.get('20:00')).toHaveLength(4)
 })
 it('rejects empty enabled schedules, invalid timezone, goal selection and unit pairs',()=>{
  const state=defaultState();state.settings.dailyDefaults.weekdays=[];state.settings.timezone='invalid';state.settings.modules.goals={inToday:true};state.settings.modules.tools={unitPairs:{length:{from:'kg',to:'m'}}}
  expect(validateSettings(state.settings,state.goals).length).toBeGreaterThanOrEqual(4)
 })
})
describe('v2 → v3 compatibility',()=>{
 it('imports the same backup repeatedly without duplicating money or losing historical metadata',()=>{
  const current=defaultState(),incoming=defaultState();ensureDailyPlan(current,today)
  incoming.financeEntries=[{id:'money',date:today,kind:'income',amountMinor:1234,currency:'THB'}]
  incoming.dayNotes[today]='A good day';incoming.doneAt[today]={wake:'2026-10-08T05:20:00Z'}
  incoming.dailyExtras[today]=[{id:'extra',module:'tasks',sourceId:'task',title:'Write',originDate:today}]
  incoming.settings.theme='dark'
  const once=mergeWorkspaceBackup(current,incoming,true),twice=mergeWorkspaceBackup(once,incoming,true)
  expect(twice).toEqual(once);expect(twice.financeEntries).toHaveLength(1);expect(twice.dayNotes[today]).toBe('A good day')
  expect(twice.doneAt[today]?.wake).toContain('05:20');expect(twice.settings.theme).toBe('dark')
  expect(twice.dailyPlans[today]).toEqual(current.dailyPlans[today])
 })
 it('retains calendar keys in extreme timezones and rejects impossible dates',()=>{
  expect(localDateKey(new Date('2026-10-07T18:00:00Z'),'Asia/Bangkok')).toBe(today)
  expect(dateLabel(today,'en-US','Pacific/Kiritimati')).toContain('October 8')
  expect(isDateKey('2026-02-31')).toBe(false)
 })
 it('rejects newer backup formats instead of replacing them with empty defaults',async()=>{
  await expect(importLegacy({app:'myhabit',state:{schemaVersion:4,habits:[]}})).rejects.toThrow('Unsupported backup version')
 })
 it('preserves IDs, settings, money and recorded habit data in the existing snapshot format',async()=>{
  const old:any=defaultState();old.schemaVersion=2;delete old.dailyPlans;delete old.dailyOverrides;delete old.dailyExtras
  old.settings={language:'en',theme:'dark',timezone:'Asia/Bangkok',focusMinutes:40,breakMinutes:10,passThreshold:4,remindersEnabled:false,reminderTime:'19:00'}
  old.habitDays[today]={habitIds:['wake'],done:{wake:true},threshold:1,rest:false};old.financeEntries=[{id:'money',date:today,kind:'income',amountMinor:1234,currency:'THB'}]
  const state=normalizeWorkspace(old);expect(state.schemaVersion).toBe(3);expect(state.settings.theme).toBe('dark');expect(resolveModule(state.settings,'focus').focusMinutes).toBe(40)
  expect(state.financeEntries[0]?.amountMinor).toBe(1234);expect(state.habitDays[today]?.habitSnapshots?.[0]?.id).toBe('wake')
  expect(await importLegacy({app:'myhabit',version:3,state})).toEqual(state)
 })
})
