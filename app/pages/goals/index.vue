<script setup lang="ts">
import { goalCurrent, goalProgress } from '#shared/domain/goals'
import type { Goal } from '#shared/domain/types'
import { localDateKey } from '#shared/domain/dates'
const { t, locale } = useI18n()
const text=(th:string,english:string)=>locale.value==='en'?english:th
const { state, touch, initialized } = useWorkspace()
const {notify}=useFeedback()
const starting=ref(0)
const title=ref('')
const kind=ref<'financial'|'weight'>('financial')
const target=ref('')
watch(kind,value=>{starting.value=value==='weight'?70:0})
const today=computed(()=>localDateKey(new Date(),state.value.settings.timezone))
function create() {
  const targetValue=Number(target.value)
  if(!initialized.value||!title.value.trim()||!Number.isFinite(targetValue)||targetValue<=0||!Number.isFinite(starting.value)||starting.value<0||kind.value==='weight'&&starting.value<=0)return
  const goal:Goal={id:crypto.randomUUID(),title:title.value.trim(),kind:kind.value,target:targetValue,startingValue:starting.value,unit:kind.value==='weight'?'kg':'THB',createdAt:new Date().toISOString()}
  state.value.goals.push(goal);title.value='';target.value='';touch();notify('เพิ่มเป้าหมายแล้ว','Goal added')
}
function current(goal:Goal){return goalCurrent(state.value,goal)}
function remove(id:string){const goal=state.value.goals.find(item=>item.id===id);if(goal){goal.archived=true;touch();notify('เก็บเป้าหมายเข้าคลังแล้ว','Goal archived',()=>{goal.archived=false;touch()})}}
function restore(goal:Goal){goal.archived=false;touch();notify('นำเป้าหมายกลับมาแล้ว','Goal restored')}
</script>

<template>
  <div class="page-wrap grid gap-5">
    <header><h1 class="page-title">{{ text('ตั้งใจไปทีละก้าว','One step toward your goals') }}</h1><p class="mb-0 mt-1 text-sm muted">{{ text('เป้าหมายระยะยาวไม่ต้องรีบ ค่อย ๆ บันทึกความเปลี่ยนแปลง','Track long-term change at your own pace') }}</p></header>
    <form class="surface grid gap-3 p-4 sm:grid-cols-2 sm:items-end" @submit.prevent="create"><label class="grid gap-1 text-xs muted"><span>{{ t('goalTitle') }}</span><input v-model="title" class="field" maxlength="100" required :placeholder="t('goalTitle')"/></label><label class="grid gap-1 text-xs muted"><span>{{ t('goalType') }}</span><select v-model="kind" class="field"><option value="financial">{{ t('financial') }}</option><option value="weight">{{ t('weight') }}</option></select></label><label class="grid gap-1 text-xs muted"><span>{{ t('target') }} · {{ kind==='weight'?'kg':'THB' }}</span><input v-model="target" class="field" type="number" min="0.01" step="any" required/></label><label class="grid gap-1 text-xs muted"><span>{{ text('ค่าเริ่มต้น','Starting value') }} · {{ kind==='weight'?'kg':'THB' }}</span><input v-model.number="starting" class="field" type="number" :min="kind==='weight'?0.01:0" step="any" required/></label><button class="btn-primary sm:col-span-2 sm:justify-self-end" :disabled="!initialized" type="submit"><UIcon name="i-lucide-plus"/>{{ t('add') }}</button></form>
    <section class="grid gap-3 sm:grid-cols-2">
      <article v-for="goal in state.goals.filter(item=>!item.archived)" :key="goal.id" class="surface grid gap-4 p-4 sm:p-5">
        <header class="flex items-start justify-between gap-3"><div><h2 class="mb-0 mt-1 text-lg font-bold">{{ goal.title }}</h2></div><button class="grid size-11 place-items-center rounded-lg muted hover:bg-[var(--mh-danger-soft)] hover:text-[var(--mh-danger)]" :aria-label="t('remove')" @click="remove(goal.id)"><UIcon name="i-lucide-trash-2"/></button></header>
        <div><div class="flex justify-between text-sm"><span class="mono font-semibold">{{ current(goal).toLocaleString() }} {{ goal.unit }}</span><span class="mono muted">{{ goal.target.toLocaleString() }} {{ goal.unit }}</span></div><div role="progressbar" :aria-label="goal.title" :aria-valuenow="Math.round(goalProgress(goal,current(goal))*100)" aria-valuemin="0" aria-valuemax="100" class="mt-2 h-2 overflow-hidden rounded-full" style="background:var(--mh-bg)"><div class="progress-fill h-full rounded-full" style="background:var(--mh-accent)" :style="{transform:`scaleX(${goalProgress(goal,current(goal))})`}"/></div></div>
        <NuxtLink :to="`/goals/${goal.id}`" class="btn-quiet justify-self-start text-sm no-underline">{{ text('บันทึกความคืบหน้า','Record progress') }} <UIcon name="i-lucide-arrow-up-right" class="size-4"/></NuxtLink>
      </article>
    </section>
    <div v-if="!state.goals.some(goal=>!goal.archived)" class="surface grid justify-items-center gap-3 p-8 text-center"><UIcon name="i-lucide-target" class="size-9 accent"/><p class="m-0 text-sm muted">{{ text('เพิ่มเป้าหมายเล็ก ๆ ที่อยากติดตาม','Add a small goal you would like to track') }}</p><NuxtLink to="/finance" class="settings-link text-sm accent">{{ text('ดูบันทึกรายรับรายจ่าย','View your financial records') }}</NuxtLink></div>
    <details v-if="state.goals.some(goal=>goal.archived)" class="surface p-4"><summary class="min-h-11 cursor-pointer">{{ text('เป้าหมายในคลัง','Archived goals') }}</summary><div v-for="goal in state.goals.filter(goal=>goal.archived)" :key="goal.id" class="setting-row"><span>{{ goal.title }}</span><button class="btn-quiet" @click="restore(goal)">{{ text('นำกลับมา','Restore') }}</button></div></details>
    <section v-if="state.goalEntries.some(row=>row.date===today)" class="surface p-4"><p class="text-sm muted m-0">{{ text('วันนี้','Today') }}</p><p v-for="row in state.goalEntries.filter(item=>item.date===today)" :key="row.id" class="mb-0 text-sm">{{ state.goals.find(goal=>goal.id===row.goalId)?.title }} · {{ row.value }} {{ state.goals.find(goal=>goal.id===row.goalId)?.unit }}</p></section>
  </div>
</template>
