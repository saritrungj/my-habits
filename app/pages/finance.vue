<script setup lang="ts">
import type { FinanceEntry } from '#shared/domain/types'
import { currencies } from '#shared/domain/exchange'
import { resolveModule } from '#shared/domain/settings'
import { localDateKey, isDateKey } from '#shared/domain/dates'
const {t,locale}=useI18n()
const text=(th:string,en:string)=>locale.value==='en'?en:th
const {state,touch,initialized}=useWorkspace()
const {notify}=useFeedback()
const defaults=computed(()=>resolveModule(state.value.settings,'finance'))
const today=computed(()=>localDateKey(new Date(),state.value.settings.timezone))
const kind=ref<'income'|'expense'>('expense'),amount=ref(''),category=ref(''),goalId=ref(''),note=ref(''),recordDate=ref(''),currency=ref('THB'),editingId=ref(''),error=ref('')
const search=ref(''),filterKind=ref('all'),filterMonth=ref('')
function reset(){editingId.value='';amount.value='';category.value=defaults.value.defaultCategory??'';kind.value=defaults.value.defaultKind??'expense';goalId.value='';note.value='';recordDate.value=today.value;currency.value='THB';error.value=''}
watch(initialized,ready=>{if(ready)reset()},{immediate:true})
watch(currency,()=>{if(goalId.value&&state.value.goals.find(goal=>goal.id===goalId.value)?.unit!==currency.value)goalId.value=''})
const totalMonth=computed(()=>state.value.financeEntries.filter(row=>row.date.startsWith(today.value.slice(0,7))&&row.currency==='THB').reduce((sum,row)=>sum+(row.kind==='income'?row.amountMinor:-row.amountMinor),0))
const rows=computed(()=>state.value.financeEntries.filter(row=>(filterKind.value==='all'||row.kind===filterKind.value)&&(!filterMonth.value||row.date.startsWith(filterMonth.value))&&[row.category,row.note,row.currency].some(value=>value?.toLowerCase().includes(search.value.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date)))
function money(row:FinanceEntry){return (row.amountMinor/100).toLocaleString(locale.value==='th'?'th-TH':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function edit(row:FinanceEntry){editingId.value=row.id;kind.value=row.kind;amount.value=(row.amountMinor/100).toFixed(2);currency.value=row.currency;category.value=row.category??'';goalId.value=row.goalId??'';note.value=row.note??'';recordDate.value=row.date;error.value='';document.getElementById('finance-form')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function save(){
 const minor=Math.round(Number(amount.value)*100)
 if(!initialized.value||!Number.isSafeInteger(minor)||minor<1||!isDateKey(recordDate.value)||recordDate.value>today.value){error.value=text('กรอกยอดเงินและวันที่ให้ถูกต้อง','Enter a valid amount and date');return}
 const previous=state.value.financeEntries.find(row=>row.id===editingId.value)
 const row:FinanceEntry={...previous,id:previous?.id??crypto.randomUUID(),date:recordDate.value,kind:kind.value,amountMinor:minor,currency:currency.value,category:category.value.trim()||undefined,goalId:goalId.value||undefined,note:note.value.trim()||undefined,sourceKey:previous?.sourceKey??`myhabit:${crypto.randomUUID()}`}
 if(previous)state.value.financeEntries.splice(state.value.financeEntries.indexOf(previous),1,row);else state.value.financeEntries.push(row)
 touch();reset();notify(previous?'อัปเดตรายการแล้ว':'บันทึกรายการแล้ว',previous?'Entry updated':'Entry saved')
}
function remove(row:FinanceEntry){state.value.financeEntries=state.value.financeEntries.filter(item=>item.id!==row.id);if(editingId.value===row.id)reset();touch();notify('ลบรายการแล้ว','Entry removed',()=>{if(!state.value.financeEntries.some(item=>item.id===row.id))state.value.financeEntries.push(row);touch()})}
</script>
<template>
 <div class="page-wrap grid gap-6">
  <header><h1 class="page-title">{{ text('บันทึกการเงิน','Record your finances') }}</h1><p class="mb-0 mt-1 text-sm muted">{{ text('รายการบันทึกช่วยให้เห็นภาพรวมของเดือนนี้','See this month through your recorded entries') }}</p></header>
  <section class="surface p-5"><p class="text-sm muted m-0">{{ text('สุทธิเดือนนี้ · THB','This month’s net · THB') }}</p><strong class="mono mt-1 block text-3xl" :class="{'danger':totalMonth<0}">{{ (totalMonth/100).toLocaleString(locale==='th'?'th-TH':'en-US',{minimumFractionDigits:2}) }}</strong><p class="mb-0 mt-2 text-xs muted">{{ text('รวมเฉพาะรายการ THB ไม่รวมยอดสกุลอื่น','Includes THB entries only; other currencies are excluded.') }}</p></section>
  <form id="finance-form" class="surface p-5" @submit.prevent="save"><h2 class="section-title mb-4">{{ editingId?text('แก้ไขรายการ','Edit entry'):t('addRecord') }}</h2><fieldset :disabled="!initialized" class="grid min-w-0 gap-4 border-0 p-0 m-0 sm:grid-cols-2">
   <label class="form-label">{{ text('ประเภท','Type') }}<select v-model="kind" class="field"><option value="expense">{{ t('expense') }}</option><option value="income">{{ t('income') }}</option></select></label>
   <label class="form-label">{{ text('จำนวนเงิน','Amount') }} · {{ currency }}<input v-model="amount" class="field" type="number" inputmode="decimal" min="0.01" max="99999999" step="0.01" required/></label>
   <label class="form-label">{{ text('วันที่','Date') }}<input v-model="recordDate" class="field" type="date" :max="today" required/></label><label class="form-label">{{ text('สกุลเงิน','Currency') }}<select v-model="currency" class="field"><option v-for="code in currencies" :key="code" :value="code">{{ code }}</option><option v-if="!currencies.includes(currency as any)" :value="currency">{{ currency }}</option></select></label>
   <label class="form-label">{{ text('หมวดหมู่','Category') }}<input v-model="category" class="field" maxlength="60" :placeholder="text('เช่น อาหาร','e.g. Food')"/></label><label class="form-label">{{ text('เชื่อมเป้าหมาย (ไม่บังคับ)','Link a goal (optional)') }}<select v-model="goalId" class="field"><option value="">{{ text('ไม่เชื่อมเป้าหมาย','No linked goal') }}</option><option v-for="goal in state.goals.filter(goal=>goal.kind==='financial'&&!goal.archived&&goal.unit===currency)" :key="goal.id" :value="goal.id">{{ goal.title }}</option></select></label>
   <label class="form-label sm:col-span-2">{{ t('note') }}<input v-model="note" class="field" maxlength="160"/></label><div class="flex flex-wrap justify-end gap-2 sm:col-span-2"><button v-if="editingId" type="button" class="btn-quiet" @click="reset">{{ t('cancel') }}</button><button class="btn-primary"><UIcon :name="editingId?'i-lucide-check':'i-lucide-plus'"/>{{ editingId?t('save'):t('addRecord') }}</button></div>
  </fieldset><p v-if="error" class="danger text-sm" role="alert">{{ error }}</p></form>
  <section class="surface overflow-hidden"><div class="grid gap-4 p-4"><div class="flex items-center justify-between gap-3"><h2 class="section-title">{{ text('รายการบันทึก','Your entries') }}</h2><span class="text-sm muted">{{ rows.length }} {{ text('รายการ','entries') }}</span></div><div class="grid gap-3 sm:grid-cols-3"><label class="form-label">{{ text('ค้นหา','Search') }}<input v-model="search" class="field" type="search" :placeholder="text('หมวดหมู่หรือบันทึก','Category or note')"/></label><label class="form-label">{{ text('กรองประเภท','Filter type') }}<select v-model="filterKind" class="field"><option value="all">{{ text('ทั้งหมด','All') }}</option><option value="income">{{ t('income') }}</option><option value="expense">{{ t('expense') }}</option></select></label><label class="form-label">{{ text('กรองเดือน (ว่าง = ทุกเดือน)','Month (empty = all)') }}<input v-model="filterMonth" class="field" type="month"/></label></div></div>
   <p v-if="!rows.length" class="px-4 pb-5 text-sm muted">{{ text('ไม่พบรายการ เพิ่มรายการหรือเปลี่ยนตัวกรอง','No entries found. Add an entry or change your filters.') }}</p>
   <div v-for="row in rows" :key="row.id" class="record-row"><span class="grid size-9 shrink-0 place-items-center rounded-xl" :style="{background:row.kind==='income'?'var(--mh-success-soft)':'var(--mh-accent-soft)',color:row.kind==='income'?'var(--mh-success)':'var(--mh-accent)'}"><UIcon :name="row.kind==='income'?'i-lucide-arrow-down-left':'i-lucide-arrow-up-right'"/></span><span class="record-copy min-w-0 flex-1"><strong class="block text-sm">{{ row.category||row.note||(row.kind==='income'?t('income'):t('expense')) }}</strong><small class="muted">{{ row.date }}<template v-if="row.goalId"> · {{ state.goals.find(goal=>goal.id===row.goalId)?.title }}</template></small></span><div class="record-amount flex items-baseline gap-2"><strong class="mono text-sm" :class="row.kind==='income'?'success':'danger'">{{ row.kind==='income'?'+':'−' }}{{ money(row) }}</strong><span class="text-xs muted">{{ row.currency }}</span></div><div class="record-actions flex gap-1"><button class="btn-quiet !px-3" :aria-label="text('แก้ไขรายการ','Edit entry')" @click="edit(row)"><UIcon name="i-lucide-pencil" class="size-4"/></button><button class="btn-quiet danger-action !px-3" :aria-label="t('remove')" @click="remove(row)"><UIcon name="i-lucide-x" class="size-4"/></button></div></div>
  </section>
 </div>
</template>
<style scoped>.record-row{display:flex;align-items:center;gap:12px;padding:16px;border-top:1px solid var(--mh-line)}.record-row:hover{background:var(--mh-hover)}#finance-form{scroll-margin-top:100px}@media(max-width:640px){.record-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px 12px}.record-copy{grid-column:2/4}.record-copy small{white-space:nowrap}.record-amount{grid-column:2;flex-wrap:wrap}.record-actions{grid-column:3}.record-amount strong{overflow-wrap:anywhere}}</style>
