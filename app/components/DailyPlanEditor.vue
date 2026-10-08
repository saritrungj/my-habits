<script setup lang="ts">
import type { DailyEntry, DailyOverride, Slot } from '#shared/domain/types'
import { addDayItem, ensureDailyPlan, moveTaskOccurrence, planForDate, setDailyOverride } from '#shared/domain/daily-plan'
import { localDateKey, isDateKey } from '#shared/domain/dates'
const props=defineProps<{date:string}>();const {state,touch,initialized}=useWorkspace();const {locale}=useI18n()
const en=computed(()=>locale.value==='en');const text=(th:string,english:string)=>en.value?english:th
const changes=ref<Record<string,DailyOverride>>({});const additions=ref<{module:'habits'|'tasks';title:string;time:string;slot:Slot}[]>([])
const title=ref(''),time=ref('07:00'),module=ref<'habits'|'tasks'>('tasks'),slot=ref<Slot>('morning'),message=ref(''),error=ref('')
const entries=computed(()=>planForDate(state.value,props.date));const current=computed(()=>localDateKey(new Date(),state.value.settings.timezone));const editable=computed(()=>initialized.value&&props.date>=current.value)
function update(entry:DailyEntry,key:keyof DailyOverride,event:Event){changes.value[entry.id]??={};const input=event.target as HTMLInputElement;(changes.value[entry.id] as any)[key]=key==='skipped'?input.checked:input.value}
function add(){if(!title.value.trim())return;additions.value.push({module:module.value,title:title.value.trim(),time:time.value,slot:slot.value});title.value=''}
function cancel(){changes.value={};additions.value=[];message.value='';error.value=''}
function save(){
  if(!editable.value)return
  error.value=''
  const validTime=(value:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  for(const change of Object.values(changes.value)){if(change.time!==undefined&&!validTime(change.time)){error.value=text('กรอกเวลาให้ถูกต้อง','Enter a valid time');return}if(change.movedTo&&(!isDateKey(change.movedTo)||change.movedTo<current.value)){error.value=text('เลื่อนงานไปวันนี้หรือวันถัดไป','Move tasks to today or a future date');return}}
  if(additions.value.some(item=>!validTime(item.time))){error.value=text('กรอกเวลาให้ถูกต้อง','Enter a valid time');return}
  if(props.date===current.value)ensureDailyPlan(state.value,props.date)
  for(const entry of entries.value){const change=changes.value[entry.id];if(!change)continue;setDailyOverride(state.value,entry,{...(change.time!==undefined?{time:change.time}:{}),...(change.skipped!==undefined?{skipped:change.skipped}:{})});if(change.movedTo)moveTaskOccurrence(state.value,entry,change.movedTo)}
  for(const item of additions.value)addDayItem(state.value,props.date,item.module,item.title,item.time,item.slot)
  touch();cancel();message.value=text(`บันทึกแผนเฉพาะ ${props.date} แล้ว`,`Saved the plan for ${props.date}`)
}
watch(()=>props.date,cancel)
</script>
<template>
  <details class="surface p-4 sm:p-5" data-testid="daily-plan-editor"><summary class="min-h-11 cursor-pointer font-medium accent">{{ text('ปรับแผนเฉพาะวัน','Edit this day’s plan') }} · {{ date }}</summary>
    <div class="grid gap-4 mt-3"><p class="help">{{ text('เปลี่ยนเฉพาะวันนี้ ไม่แก้ตารางประจำ การข้ามไม่ถือว่าทำเสร็จ','Changes affect only this date. Skipping an item does not mark it complete.') }}</p><p v-if="!editable" class="help">{{ text('แผนย้อนหลังคงตามที่บันทึกไว้','Past plans retain their recorded schedule.') }}</p>
      <fieldset :disabled="!editable" class="border-0 p-0 m-0 min-w-0 grid gap-3">
        <article v-for="entry in entries" :key="entry.id" class="plan-edit-row"><strong class="text-sm font-medium">{{ entry.module==='focus'?text('โฟกัส','Focus'):entry.module==='mood'?text('เช็กอารมณ์','Mood check-in'):entry.title }}</strong><div class="grid gap-3 sm:grid-cols-3"><label class="form-label">{{ text('เวลาเฉพาะวัน','Time for this day') }}<input class="field" type="time" :aria-label="`${entry.title} day time`" :value="changes[entry.id]?.time??(/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.time??'')?entry.time:'')" @change="update(entry,'time',$event)"/></label><label class="setting-row"><span>{{ text('ข้ามวันนี้','Skip this day') }}</span><input type="checkbox" :aria-label="`${entry.title} skip`" :checked="changes[entry.id]?.skipped??entry.skipped??false" @change="update(entry,'skipped',$event)"/></label><label v-if="entry.module==='tasks'" class="form-label">{{ text('เลื่อนไปวันที่','Move to date') }}<input class="field" type="date" :min="current" :aria-label="`${entry.title} move date`" :value="changes[entry.id]?.movedTo??''" @change="update(entry,'movedTo',$event)"/></label></div></article>
        <div class="grid gap-3 settings-divider"><h3 class="section-title">{{ text('เพิ่มเฉพาะวัน','Add for this day') }}</h3><div class="grid gap-3 sm:grid-cols-2"><label class="form-label">{{ text('ประเภท','Type') }}<select v-model="module" class="field"><option value="tasks">{{ text('งาน','Task') }}</option><option value="habits">{{ text('กิจวัตร','Habit') }}</option></select></label><label class="form-label">{{ text('ชื่อรายการ','Item name') }}<input v-model="title" class="field" maxlength="120" aria-label="Day item name"/></label><label class="form-label">{{ text('เวลา','Time') }}<input v-model="time" class="field" type="time"/></label><label v-if="module==='habits'" class="form-label">{{ text('ช่วงวัน','Day period') }}<select v-model="slot" class="field"><option value="morning">{{ text('เช้า','Morning') }}</option><option value="afternoon">{{ text('ระหว่างวัน','During the day') }}</option><option value="evening">{{ text('เย็น','Evening') }}</option></select></label></div><button class="btn-quiet justify-self-start" type="button" :disabled="!title.trim()" @click="add">{{ text('เพิ่มในแผน','Add to plan') }}</button><div v-for="(item,index) in additions" :key="index" class="setting-row"><span>{{ item.title }} · {{ item.time }}</span><button type="button" class="btn-quiet" @click="additions.splice(index,1)">{{ text('เอาออก','Remove') }}</button></div>
        </div><div class="flex flex-wrap gap-2"><button type="button" class="btn-primary" @click="save">{{ text('บันทึกแผนวันนี้','Save day plan') }}</button><button type="button" class="btn-quiet" @click="cancel">{{ text('ยกเลิก','Cancel') }}</button></div>
      </fieldset><p v-if="error" class="danger text-sm" role="alert">{{ error }}</p><p v-if="message" class="notice text-sm" role="status">{{ message }}</p>
    </div>
  </details>
</template>
<style scoped>.plan-edit-row{padding:12px 0;border-bottom:1px solid var(--mh-line);display:grid;gap:12px}</style>
