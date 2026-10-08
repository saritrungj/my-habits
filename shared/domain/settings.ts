import { defaultState, type DailySettings, type ModuleId, type ModuleSettingsMap, type MyhabitSettings, type MyhabitState } from './types'
import { dateOffset, isDateKey, localDateKey } from './dates'
import { unitSets } from './converters'

export const moduleRegistry: { id: ModuleId; th: string; en: string; icon: string; route: string; daily: boolean }[] = [
  { id:'habits',th:'กิจวัตร',en:'Habits',icon:'i-lucide-circle-check',route:'/today',daily:true },
  { id:'tasks',th:'งาน',en:'Tasks',icon:'i-lucide-list-todo',route:'/tasks',daily:true },
  { id:'goals',th:'เป้าหมาย',en:'Goals',icon:'i-lucide-target',route:'/goals',daily:true },
  { id:'focus',th:'โฟกัส',en:'Focus',icon:'i-lucide-timer',route:'/focus',daily:true },
  { id:'mood',th:'อารมณ์',en:'Mood',icon:'i-lucide-smile',route:'/mood',daily:true },
  { id:'finance',th:'การเงิน',en:'Finance',icon:'i-lucide-wallet',route:'/finance',daily:false },
  { id:'progress',th:'ความคืบหน้า',en:'Progress',icon:'i-lucide-chart-no-axes-column-increasing',route:'/progress',daily:false },
  { id:'tools',th:'เครื่องมือ',en:'Tools',icon:'i-lucide-sliders-horizontal',route:'/tools',daily:false }
]
export const moduleDefaults: ModuleSettingsMap = {
  habits:{inToday:true},tasks:{inToday:true,defaultPriority:'med',defaultRecurrence:'once'},goals:{inToday:false,goalIds:[]},
  focus:{inToday:false,targetMinutes:25},mood:{inToday:false},finance:{defaultKind:'expense',defaultCategory:''},
  progress:{weekStartsOn:0,showHeatmap:true},tools:{peopleCount:2,serviceEnabled:false,vatEnabled:false,serviceRate:.1,vatRate:.07,unitPairs:{}}
}
export const clone = <T>(value:T):T => JSON.parse(JSON.stringify(value)) as T
export function dailyValues(settings: MyhabitSettings): DailySettings {
  const {dailyDefaults,modules,passThreshold,focusMinutes,breakMinutes,remindersEnabled,reminderTime}=settings
  return clone({dailyDefaults,modules,passThreshold,focusMinutes,breakMinutes,remindersEnabled,reminderTime})
}
export function settingsForDate(settings:MyhabitSettings,date:string):MyhabitSettings {
  const version=[...settings.scheduleVersions].filter(item=>item.effectiveFrom<=date).sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom)).at(-1)
  return version?{...settings,...version.values}:settings
}
export function resolveModule<K extends ModuleId>(settings:MyhabitSettings,id:K,date?:string) {
  const source=date?settingsForDate(settings,date):settings
  const common={weekdays:source.dailyDefaults.weekdays,time:source.dailyDefaults.time,remindersEnabled:source.remindersEnabled,reminderTime:source.reminderTime}
  const legacy=id==='habits'?{passThreshold:source.passThreshold}:id==='focus'?{focusMinutes:source.focusMinutes,breakMinutes:source.breakMinutes}:{}
  return {...common,...moduleDefaults[id],...legacy,...source.modules[id]} as typeof common & ModuleSettingsMap[K]
}
export function saveSettings(state:MyhabitState,next:MyhabitSettings,today:string) {
  const previous=dailyValues(state.settings)
  const versions=clone(state.settings.scheduleVersions)
  if(!versions.length)versions.push({effectiveFrom:'0000-01-01',values:previous})
  if(JSON.stringify(previous)!==JSON.stringify(dailyValues(next))) {
    const effectiveFrom=dateOffset(today,1)
    const retained=versions.filter(item=>item.effectiveFrom!==effectiveFrom)
    retained.push({effectiveFrom,values:dailyValues(next)})
    next.scheduleVersions=retained
  } else next.scheduleVersions=versions
  state.settings=clone(next)
}
const object=(value:unknown):Record<string,any>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>:{}
export function normalizeWorkspace(input:unknown):MyhabitState {
  const raw=object(clone(input??{})),base=defaultState(),settings=object(raw.settings)
  const modules=Object.fromEntries(moduleRegistry.map(item=>[item.id,object(object(settings.modules)[item.id])])) as ModuleSettingsMap
  const result={...base,...raw,schemaVersion:3,settings:{...base.settings,...settings,dailyDefaults:{...base.settings.dailyDefaults,...object(settings.dailyDefaults)},modules,scheduleVersions:Array.isArray(settings.scheduleVersions)?settings.scheduleVersions:[]}} as MyhabitState
  const validDays=(value:unknown)=>Array.isArray(value)&&value.length>0&&value.every(day=>Number.isInteger(day)&&day>=0&&day<=6)
  const validTime=(value:unknown)=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  if(!validDays(result.settings.dailyDefaults.weekdays))result.settings.dailyDefaults.weekdays=[0,1,2,3,4,5,6]
  if(!validTime(result.settings.dailyDefaults.time))result.settings.dailyDefaults.time='20:00'
  if(!validTime(result.settings.reminderTime))result.settings.reminderTime='20:00'
  if(!['light','dark','system'].includes(result.settings.theme))result.settings.theme='system'
  if(!['th','en'].includes(result.settings.language))result.settings.language='th'
  try{new Intl.DateTimeFormat('en',{timeZone:result.settings.timezone})}catch{result.settings.timezone='Asia/Bangkok'}
  for(const module of moduleRegistry){const values=result.settings.modules[module.id] as Record<string,any>;if(values.weekdays!==undefined&&!validDays(values.weekdays))delete values.weekdays;for(const key of ['time','reminderTime'])if(values[key]!==undefined&&!validTime(values[key]))delete values[key]}
  for(const key of ['habits','tasks','goals','goalEntries','financeEntries','focusSessions','moodEntries','billDrafts','migrationWarnings'] as const) if(!Array.isArray(result[key])) (result as any)[key]=base[key]
  for(const key of ['habitDays','dayNotes','subtasksDone','doneAt','legacySources','dailyPlans','dailyOverrides','dailyExtras'] as const) (result as any)[key]=object(raw[key])
  if(raw.schemaVersion===2)for(const habit of result.habits)habit.recurrence??={type:'daily'}
  if(!result.settings.scheduleVersions.length)result.settings.scheduleVersions=[{effectiveFrom:'0000-01-01',values:dailyValues(result.settings)}]
  for(const day of Object.values(result.habitDays)) {
    if(!day.habitSnapshots)day.habitSnapshots=day.habitIds.map(id=>result.habits.find(habit=>habit.id===id)).filter(item=>Boolean(item)).map(item=>clone(item!))
  }
  const today=localDateKey(new Date(),result.settings.timezone)
  const recordedDates=new Set([...Object.keys(result.habitDays),...result.tasks.flatMap(task=>[task.date,...task.completedDates??[]])])
  for(const date of recordedDates){
    if(!isDateKey(date)||date>=today||result.dailyPlans[date])continue
    const weekday=new Date(`${date}T12:00:00Z`).getUTCDay()
    const habits=(result.habitDays[date]?.habitSnapshots??[]).map(habit=>({id:`habits:${habit.id}:${date}`,module:'habits' as const,sourceId:habit.id,title:habit.title,time:habit.time,slot:habit.slot,originDate:date}))
    const tasks=result.tasks.filter(task=>task.recurrence?task.date<=date&&(task.recurrence.type==='daily'||task.recurrence.weekdays.includes(weekday)):task.date===date).map(task=>({id:`tasks:${task.id}:${date}`,module:'tasks' as const,sourceId:task.id,title:task.title,time:task.time,originDate:date}))
    result.dailyPlans[date]={entries:[...habits,...tasks]}
  }
  return result
}
export function validateSettings(settings:MyhabitSettings,goals:MyhabitState['goals']):string[] {
  const errors:string[]=[]
  const en=settings.language==='en'
  const fail=(th:string,english:string)=>errors.push(en?english:th)
  try{new Intl.DateTimeFormat('en',{timeZone:settings.timezone})}catch{fail('Timezone ไม่ถูกต้อง','Enter a valid timezone')}
  if(!['light','dark','system'].includes(settings.theme))fail('ธีมไม่ถูกต้อง','Invalid theme')
  const time=(value:unknown)=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  const days=(value:unknown)=>Array.isArray(value)&&value.length>0&&value.every(day=>Number.isInteger(day)&&day>=0&&day<=6)
  if(!days(settings.dailyDefaults.weekdays))fail('เลือกวันเริ่มต้นอย่างน้อยหนึ่งวัน','Choose at least one default weekday')
  if(!time(settings.dailyDefaults.time)||!time(settings.reminderTime))fail('เวลาไม่ถูกต้อง','Enter a valid time')
  const range=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max
  if(!range(settings.passThreshold,1,30)||!range(settings.focusMinutes,1,180)||!range(settings.breakMinutes,1,60)||![settings.passThreshold,settings.focusMinutes,settings.breakMinutes].every(Number.isInteger))fail('ตรวจเกณฑ์ผ่านและนาทีโฟกัส/พัก','Check the habit threshold and focus/break minutes')
  for(const module of moduleRegistry) {
    const raw=settings.modules[module.id] as Record<string,any>,resolved=resolveModule(settings,module.id)
    if(module.id!=='progress'&&module.id!=='tools'&&(!days(resolved.weekdays)||!time(resolved.time)||!time(resolved.reminderTime)))fail(`ตรวจวันและเวลาของ${module.th}`,`Check the schedule for ${module.en}`)
    for(const [key,min,max] of [['passThreshold',1,30],['focusMinutes',1,180],['breakMinutes',1,60],['targetMinutes',1,1440],['peopleCount',1,30],['serviceRate',0,1],['vatRate',0,1],['weekStartsOn',0,6]] as const)if(raw[key]!==undefined&&(!range(raw[key],min,max)||!['serviceRate','vatRate'].includes(key)&&!Number.isInteger(raw[key])))fail(`ค่า ${key} ไม่ถูกต้อง`,`Invalid ${key}`)
  }
  const goalModule=resolveModule(settings,'goals')
  if(goalModule.inToday&&!goalModule.goalIds?.some(id=>goals.some(goal=>goal.id===id&&!goal.archived)))fail('เลือกเป้าหมายที่ต้องเช็กอินอย่างน้อยหนึ่งรายการ','Select at least one goal for daily check-in')
  for(const [kind,pair] of Object.entries(settings.modules.tools.unitPairs??{})) {
    const units=unitSets[kind as keyof typeof unitSets]
    if(!units?.some(unit=>unit.id===pair.from)||!units.some(unit=>unit.id===pair.to))fail('คู่หน่วยเริ่มต้นไม่ถูกต้อง','Invalid default unit pair')
  }
  return errors
}
