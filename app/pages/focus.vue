<script setup lang="ts">
import { localDateKey } from '#shared/domain/dates'
const { t, locale }=useI18n();const {state,initialized}=useWorkspace()
const {phase,running,remaining,now,selectedTask,percent,setPhase,start,pause,reset}=useFocusTimer()
const today=computed(()=>localDateKey(new Date(now.value),state.value.settings.timezone))
const focusToday=computed(()=>state.value.focusSessions.filter(session=>localDateKey(new Date(session.startedAt),state.value.settings.timezone)===today.value).reduce((sum,session)=>sum+session.minutes,0))
function clock(seconds:number){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
const text=(th:string,english:string)=>locale.value==='en'?english:th
</script>
<template>
  <div class="page-wrap mx-auto grid max-w-3xl gap-5">
    <header><h1 class="page-title">{{ text('อยู่กับสิ่งตรงหน้า','Stay with what matters now') }}</h1><p class="mb-0 mt-1 text-sm muted">{{ text('นาฬิกาทำงานต่อได้แม้สลับแท็บหรือรีโหลด','The timer continues across tabs and reloads') }}</p></header>
    <section class="surface grid justify-items-center gap-5 p-6 sm:p-9">
      <div class="flex gap-2"><button class="btn-quiet" :class="{selected:phase==='focus'}" :aria-pressed="phase==='focus'" @click="setPhase('focus')">{{ t('focus') }}</button><button class="btn-quiet" :class="{selected:phase==='break'}" :aria-pressed="phase==='break'" @click="setPhase('break')">{{ text('พัก','Break') }}</button></div>
      <div class="focus-clock relative grid place-items-center"><svg viewBox="0 0 240 240" class="absolute inset-0 size-full -rotate-90"><circle cx="120" cy="120" r="108" fill="none" stroke="var(--mh-line)" stroke-width="5"/><circle cx="120" cy="120" r="108" fill="none" stroke="var(--mh-accent)" stroke-width="5" stroke-linecap="round" :stroke-dasharray="679" :stroke-dashoffset="679*(1-percent/100)" class="transition-all duration-200"/></svg><div class="text-center"><strong class="mono text-6xl tracking-tight">{{ clock(remaining) }}</strong><p class="m-0 mt-2 text-sm muted">{{ phase==='focus'?text('ช่วงโฟกัส','Focus session'):text('ช่วงพัก','Break session') }}</p></div></div>
      <label v-if="state.tasks.some(task=>task.status!=='done')" class="grid w-full max-w-sm gap-1 text-xs muted"><span>{{ text('เชื่อมกับงาน (เลือกได้)','Link a task (optional)') }}</span><select v-model="selectedTask" class="field"><option value="">{{ text('ไม่เชื่อมงาน','No linked task') }}</option><option v-for="task in state.tasks.filter(task=>task.status!=='done')" :key="task.id" :value="task.id">{{ task.title }}</option></select></label>
      <div class="flex gap-2"><button class="btn-primary min-w-28" :disabled="!initialized" @click="running?pause():start()"><UIcon :name="running?'i-lucide-pause':'i-lucide-play'"/>{{ running?t('pause'):t('start') }}</button><button class="btn-quiet" @click="reset"><UIcon name="i-lucide-rotate-ccw"/>{{ t('reset') }}</button></div>
    </section>
    <div class="grid grid-cols-2 gap-3"><div class="surface p-4"><p class="text-sm muted m-0">{{ text('นาทีโฟกัสวันนี้','Focus minutes today') }}</p><strong class="mono text-2xl">{{ focusToday }}</strong></div><div class="surface p-4"><p class="text-sm muted m-0">{{ text('รวม session','Total sessions') }}</p><strong class="mono text-2xl">{{ state.focusSessions.length }}</strong></div></div>
    <section v-if="state.focusSessions.length" class="surface divide-y p-4" style="--tw-divide-opacity:1"><h2 class="m-0 pb-3 text-sm font-bold">{{ text('ช่วงที่ทำเสร็จล่าสุด','Recent completed sessions') }}</h2><div v-for="session in [...state.focusSessions].reverse().slice(0,8)" :key="session.id" class="flex justify-between py-3 text-sm"><span>{{ state.tasks.find(task=>task.id===session.taskId)?.title||t('focus') }}<small class="block muted">{{ new Date(session.endedAt).toLocaleString() }}</small></span><strong class="mono">{{ session.minutes }} {{ text('นาที','minutes') }}</strong></div></section>
  </div>
</template>
<style scoped>.selected{color:var(--mh-accent);border-color:var(--mh-accent);background:var(--mh-accent-soft)}.focus-clock{width:min(256px,100%);aspect-ratio:1;min-width:0}.page-wrap>section{min-width:0}@media(max-width:380px){.page-wrap>section{padding:20px}.focus-clock strong{font-size:3rem}}
</style>
