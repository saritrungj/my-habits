export type Slot = 'morning' | 'afternoon' | 'evening'
export type Recurrence = { type: 'daily' } | { type: 'weekly'; weekdays: number[] }
export type HabitVersion = { effectiveFrom: string; title: string; description?: string; time?: string|null; slot: Slot; active: boolean; recurrence?: Recurrence|null }
export type Habit = { id: string; title: string; description?: string; time?: string; slot: Slot; active: boolean; createdAt: string; legacy?: boolean; recurrence?: Recurrence; startsOn?: string; onlyOn?: string; versions?: HabitVersion[] }
export type HabitDay = { habitIds: string[]; done: Record<string, boolean>; threshold: number; rest: boolean; updatedAt?: string; habitSnapshots?: Habit[]; skippedIds?: string[] }
export type TaskVersion = { effectiveFrom:string;title:string;date:string;time?:string|null;priority:'low'|'med'|'high';recurrence?:Recurrence|null;archived?:boolean }
export type Task = { id: string; title: string; date: string; status: 'todo' | 'in-progress' | 'done'; priority: 'low' | 'med' | 'high'; subtasks: { id: string; title: string; done: boolean }[]; recurrence?: Recurrence; category?: 'work'|'self-dev'; completedDates?: string[]; createdAt: string; legacyId?: string; time?: string; archived?: boolean;versions?:TaskVersion[] }
export type Goal = { id: string; title: string; kind: 'financial' | 'weight'; target: number; startingValue: number; unit: string; createdAt: string; archived?: boolean }
export type GoalEntry = { id: string; goalId: string; date: string; value: number; note?: string }
export type FinanceEntry = { id: string; date: string; kind: 'income' | 'expense'; amountMinor: number; currency: string; category?: string; goalId?: string; note?: string; sourceKey?: string }
export type FocusSession = { id: string; taskId?: string; startedAt: string; endedAt: string; minutes: number }
export type MoodEntry = { date: string; mood: 'happy' | 'calm' | 'tired' | 'sad' | 'stressed'; energy: number; gratitude?: string; vent?: string }
export type BillDraft = { id: string; title: string; amountMinor: number; people: { id: string; name: string; amountMinor: number; share?: number }[]; serviceRate: number; vatRate: number; createdAt: string }
export type ModuleId = 'habits' | 'tasks' | 'goals' | 'focus' | 'mood' | 'finance' | 'progress' | 'tools'
export type DailyModuleId = 'habits' | 'tasks' | 'goals' | 'focus' | 'mood'
export type CommonModuleSettings = { weekdays?: number[]; time?: string; remindersEnabled?: boolean; reminderTime?: string }
export type ModuleSettingsMap = {
  habits: CommonModuleSettings & { inToday?: boolean; passThreshold?: number }
  tasks: CommonModuleSettings & { inToday?: boolean; defaultPriority?: Task['priority']; defaultRecurrence?: 'once' | 'daily' | 'weekly' }
  goals: CommonModuleSettings & { inToday?: boolean; goalIds?: string[] }
  focus: CommonModuleSettings & { inToday?: boolean; focusMinutes?: number; breakMinutes?: number; targetMinutes?: number }
  mood: CommonModuleSettings & { inToday?: boolean }
  finance: CommonModuleSettings & { defaultKind?: FinanceEntry['kind']; defaultCategory?: string }
  progress: { weekStartsOn?: number; showHeatmap?: boolean }
  tools: { peopleCount?: number; serviceEnabled?: boolean; vatEnabled?: boolean; serviceRate?: number; vatRate?: number; unitPairs?: Record<string, { from: string; to: string }> }
}
export type DailySettings = { dailyDefaults: { weekdays: number[]; time: string }; modules: ModuleSettingsMap; passThreshold: number; focusMinutes: number; breakMinutes: number; remindersEnabled: boolean; reminderTime: string }
export type MyhabitSettings = DailySettings & { language: 'th' | 'en'; theme: 'light' | 'dark' | 'system'; timezone: string; scheduleVersions: { effectiveFrom: string; values: DailySettings }[] }
export type DailyEntry = { id: string; module: DailyModuleId; sourceId: string; title: string; time?: string; slot?: Slot; target?: number; originDate: string }
export type DailyOverride = { time?: string; skipped?: boolean; movedTo?: string }
export type MyhabitState = {
  schemaVersion: 3
  habits: Habit[]
  habitDays: Record<string, HabitDay>
  dayNotes: Record<string,string>
  subtasksDone: Record<string,Record<string,Record<string,boolean>>>
  doneAt: Record<string,Record<string,string>>
  tasks: Task[]
  goals: Goal[]
  goalEntries: GoalEntry[]
  financeEntries: FinanceEntry[]
  focusSessions: FocusSession[]
  moodEntries: MoodEntry[]
  billDrafts: BillDraft[]
  settings: MyhabitSettings
  dailyPlans: Record<string, { entries: DailyEntry[] }>
  dailyOverrides: Record<string, Record<string, DailyOverride>>
  dailyExtras: Record<string, DailyEntry[]>
  migrationWarnings: string[]
  legacySources: Record<string, unknown>
}

export const legacyHabits: Habit[] = [
  { id: 'sleep', title: 'เข้านอนตรงเวลา', description: 'เมื่อคืนนอนก่อน 4 ทุ่ม', time: '22:00', slot: 'evening', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true },
  { id: 'wake', title: 'ตื่นตามเวลา', description: 'ไม่กดเลื่อนนาฬิกาปลุก', time: '05:20', slot: 'morning', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true },
  { id: 'dog', title: 'พาหมาเดิน', description: '10 นาที เดินเร็วเป็นวอร์มอัพ', time: '06:05', slot: 'morning', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true },
  { id: 'am', title: 'ออกกำลังกายเช้า', description: '15–25 นาที ก่อนอาบน้ำ', time: '06:15', slot: 'morning', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true },
  { id: 'snack', title: 'ของว่างมีประโยชน์', description: 'ผลไม้ ถั่ว ไข่ต้ม แทนขนม', time: 'ทั้งวัน', slot: 'afternoon', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true },
  { id: 'pm', title: 'ออกกำลังกายเย็น', description: 'เลิกงานแล้วเปลี่ยนชุดทันที', time: '17:20', slot: 'evening', active: true, createdAt: '2024-01-01T00:00:00.000Z', legacy: true }
]

export const defaultState = (): MyhabitState => ({
  schemaVersion: 3,
  habits: structuredClone(legacyHabits).map(habit=>({...habit,recurrence:{type:'daily' as const}})), habitDays: {}, dayNotes:{},subtasksDone:{},doneAt:{},tasks: [], goals: [], goalEntries: [], financeEntries: [], focusSessions: [], moodEntries: [], billDrafts: [],
  settings: { language: 'th', theme: 'system', timezone: 'Asia/Bangkok', focusMinutes: 25, breakMinutes: 5, passThreshold: 4, remindersEnabled:false,reminderTime:'20:00', dailyDefaults:{weekdays:[0,1,2,3,4,5,6],time:'20:00'}, modules:{habits:{},tasks:{},goals:{},focus:{},mood:{},finance:{},progress:{},tools:{}},scheduleVersions:[] }, dailyPlans:{},dailyOverrides:{},dailyExtras:{}, migrationWarnings: [], legacySources: {}
})
