<script setup lang="ts">
import { resolveModule } from '#shared/domain/settings'
import { dayFor, habitsForDate, passed, streak } from '#shared/domain/habits'
import { localDateKey, monthDays, dateOffset } from '#shared/domain/dates'
const { t, locale } = useI18n()
const { state } = useWorkspace()
const preferences=computed(()=>resolveModule(state.value.settings,'progress'))
const now = ref(new Date())
const view = ref(new Date())
const currentDate = computed(() => localDateKey(now.value, state.value.settings.timezone))
const month = computed(() => `${view.value.getFullYear()}-${String(view.value.getMonth()+1).padStart(2,'0')}`)
const days = computed(() => monthDays(month.value))
const offset = computed(() => { const [year, m] = month.value.split('-').map(Number); return (new Date(Date.UTC(year,m-1,1,12)).getUTCDay()-(preferences.value.weekStartsOn??0)+7)%7 })
const entries = computed(() => Array.from({length:days.value}, (_, i) => `${month.value}-${String(i+1).padStart(2,'0')}`).filter(date => date <= currentDate.value))
const activity = (date: string) => {
  const day = dayFor(state.value, date)
  const total = habitsForDate(state.value, date).length
  const complete = day.habitIds.filter(id => day.done[id]&&!day.skippedIds?.includes(id)).length
  return { day, total, complete, percent: total ? Math.round(complete / total * 100) : 0, pass: passed(day) }
}
const passedDays = computed(() => entries.value.filter(date => state.value.habitDays[date] && activity(date).pass).length)
const avg = computed(() => {
  const tracked = entries.value.filter(date => state.value.habitDays[date] && state.value.habitDays[date].habitIds.length)
  return tracked.length ? Math.round(tracked.reduce((sum, date) => sum + activity(date).percent, 0)/tracked.length) : 0
})
const heatDays = computed(() => {
  const jan1 = `${view.value.getFullYear()}-01-01`
  const end = view.value.getFullYear() === Number(currentDate.value.slice(0,4)) ? currentDate.value : `${view.value.getFullYear()}-12-31`
  const cells: (string|null)[] = Array((new Date(`${jan1}T12:00:00Z`).getUTCDay()-(preferences.value.weekStartsOn??0)+7)%7).fill(null)
  for (let date=jan1; date<=end; date=dateOffset(date,1)) cells.push(date)
  return cells
})
const monthLabel = computed(() => new Intl.DateTimeFormat(locale.value==='th'?'th-TH':'en-US',{month:'long',year:locale.value==='th'?'numeric':'numeric',calendar:locale.value==='th'?'buddhist':'gregory'}).format(view.value))
const weekdays = computed(() => Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale.value==='th'?'th-TH':'en-US',{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2024,0,7+i+(preferences.value.weekStartsOn??0),12)))) )
const recentStreak = computed(() => streak(state.value, currentDate.value))
function shiftMonth(delta:number) { view.value = new Date(view.value.getFullYear(),view.value.getMonth()+delta,1) }
function tone(date:string|null) {
  if (!date) return 'transparent'
  const row=activity(date)
  if (!row.total && !state.value.habitDays[date]) return 'var(--mh-bg)'
  if (row.percent===0) return 'var(--mh-heat-0)'
  if (row.percent<50) return 'var(--mh-heat-1)'
  if (row.percent<85) return 'var(--mh-heat-2)'
  return 'var(--mh-heat-3)'
}
const text=(th:string,english:string)=>locale.value==='en'?english:th
</script>

<template>
  <div class="page-wrap progress-page">
    <header><h1 class="page-title">{{ text('เห็นทางที่เดินมา','See your progress') }}</h1><p class="mb-0 mt-1 text-sm muted">{{ text('วันดี ๆ ไม่จำเป็นต้องเหมือนกันทุกวัน','Good days do not have to look the same') }}</p></header>
    <section class="grid grid-cols-3 overflow-hidden surface">
      <div class="p-4 sm:p-5"><strong class="block text-2xl font-bold mono">{{ avg }}%</strong><span class="text-xs muted">{{ t('average') }} · {{ text('เดือนนี้','this month') }}</span></div>
      <div class="border-l p-4 sm:p-5" style="border-color:var(--mh-line)"><strong class="block text-2xl font-bold mono">{{ passedDays }}</strong><span class="text-xs muted">{{ t('passedDays') }}</span></div>
      <div class="border-l p-4 sm:p-5" style="border-color:var(--mh-line)"><strong class="block text-2xl font-bold mono">{{ recentStreak }}</strong><span class="text-xs muted">{{ t('bestStreak') }}</span></div>
    </section>
    <section class="surface month-panel p-4 sm:p-6">
      <div class="mb-4 flex items-center justify-between gap-3"><div><h2 class="m-0 text-xl font-bold">{{ monthLabel }}</h2></div><div class="flex gap-2"><button class="btn-quiet size-11 p-0" :aria-label="text('เดือนก่อน','Previous month')" @click="shiftMonth(-1)"><UIcon name="i-lucide-chevron-left" /></button><button class="btn-quiet size-11 p-0" :aria-label="text('เดือนถัดไป','Next month')" :disabled="view.getFullYear()===now.getFullYear()&&view.getMonth()===now.getMonth()" @click="shiftMonth(1)"><UIcon name="i-lucide-chevron-right" /></button></div></div>
      <div class="calendar-grid">
        <span v-for="day in weekdays" :key="day" class="pb-1 text-center text-[11px] muted">{{ day }}</span>
        <span v-for="n in offset" :key="`blank-${n}`" />
        <NuxtLink v-for="n in days" :key="n" :to="`/today?date=${month}-${String(n).padStart(2,'0')}`" class="calendar-day grid aspect-square place-items-center rounded-xl text-xs no-underline" :class="{'calendar-selected':`${month}-${String(n).padStart(2,'0')}`===currentDate}" :style="{background:tone(`${month}-${String(n).padStart(2,'0')}`),color:activity(`${month}-${String(n).padStart(2,'0')}`).percent>=85?'var(--mh-accent-ink)':activity(`${month}-${String(n).padStart(2,'0')}`).percent>=50?'var(--mh-heat-ink)':'var(--mh-ink)'}" :title="`${n} · ${activity(`${month}-${String(n).padStart(2,'0')}`).complete}/${activity(`${month}-${String(n).padStart(2,'0')}`).total}`">{{ n }}</NuxtLink>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3"><p class="m-0 text-xs muted">{{ text('แตะวันที่เพื่อดูรายการในวันนั้น','Select a date to see its plan') }}</p><div class="flex items-center gap-1.5 text-[10px] muted"><span>{{ text('น้อย','Less') }}</span><i v-for="color in ['var(--mh-heat-0)','var(--mh-heat-1)','var(--mh-heat-2)','var(--mh-heat-3)']" :key="color" class="size-3 rounded-sm" :style="{background:color}"/><span>{{ text('มาก','More') }}</span></div></div>
    </section>
    <section v-if="preferences.showHeatmap" class="surface year-panel overflow-hidden p-4 sm:p-6">
      <div class="flex items-end justify-between"><div><h2 class="m-0 text-lg font-bold">{{ text('จังหวะของทั้งปี','Your year at a glance') }}</h2></div><span class="text-xs muted">{{ entries.length }} {{ text('วัน','days') }}</span></div>
      <div class="mt-4 overflow-x-auto pb-2"><div class="heatmap" :style="{gridTemplateRows:'repeat(7, 11px)'}"><span v-for="(date,index) in heatDays" :key="date??`none-${index}`" class="size-[11px] rounded-[3px]" :style="{background:tone(date)}" :title="date??''" /></div></div>
    </section>
    <section v-if="!Object.keys(state.habitDays).length" class="surface p-5 text-sm muted">{{ text('หลังเช็กกิจวัตร ความคืบหน้าของแต่ละวันจะแสดงที่นี่','Your daily progress appears here after checking in') }}</section>
  </div>
</template>

<style scoped>
.calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;padding:2px}
.calendar-day { min-height: 44px; transition: transform 150ms ease, box-shadow 150ms ease; }
.calendar-day:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgb(20 23 31 / 10%); }
.calendar-selected { box-shadow: inset 0 0 0 2px var(--mh-ink); font-weight: 700; }
.heatmap { display: grid; grid-auto-flow: column; grid-auto-columns: 11px; gap: 3px; width: max-content; }
.progress-page{display:grid;gap:28px}.calendar-day{min-width:0}
@media(min-width:1200px){.progress-page{grid-template-columns:minmax(0,1fr) 300px;align-items:start}.progress-page>header,.progress-page>section:nth-child(2){grid-column:1/-1}.month-panel{grid-column:1}.year-panel{grid-column:2}.calendar-day{aspect-ratio:1.2}}
</style>
