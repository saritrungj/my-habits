<script setup lang="ts">
const {t,locale}=useI18n()
const text=(th:string,english:string)=>locale.value==='en'?english:th
const tools=computed(()=>[
  {to:'/tools/convert/currency',title:text('สกุลเงิน','Currency'),desc:text('THB, USD, EUR, JPY และ GBP · อัตราอ้างอิงรายวัน','THB, USD, EUR, JPY and GBP · daily reference rates'),icon:'i-lucide-banknote'},
  {to:'/tools/split-bill',title:text('หารบิล','Split a bill'),desc:text('แบ่งยอดตามคน รวมค่าบริการและ VAT พร้อม QR สำหรับ PromptPay','Divide shares, service charge and VAT with PromptPay QR'),icon:'i-lucide-receipt',accent:true},
  {to:'/tools/convert/length',title:text('ระยะทาง','Length'),desc:text('เมตร กิโลเมตร ไมล์ ฟุต และนิ้ว','Meters, kilometers, miles, feet and inches'),icon:'i-lucide-ruler'},
  {to:'/tools/convert/weight',title:text('น้ำหนัก','Weight'),desc:text('กิโลกรัม กรัม ปอนด์ และออนซ์','Kilograms, grams, pounds and ounces'),icon:'i-lucide-weight'},
  {to:'/tools/convert/volume',title:text('ปริมาตร','Volume'),desc:text('ลิตร มิลลิลิตร ถ้วย และแกลลอน','Liters, milliliters, cups and gallons'),icon:'i-lucide-flask-conical'},
  {to:'/tools/convert/temperature',title:text('อุณหภูมิ','Temperature'),desc:text('เซลเซียส ฟาเรนไฮต์ และเคลวิน','Celsius, Fahrenheit and Kelvin'),icon:'i-lucide-thermometer'},
  {to:'/tools/convert/time',title:text('เวลา','Time'),desc:text('วินาที นาที ชั่วโมง และวัน','Seconds, minutes, hours and days'),icon:'i-lucide-clock'},
  {to:'/tools/convert/speed',title:text('ความเร็ว','Speed'),desc:text('กม./ชม. ม./วินาที ไมล์/ชม. และนอต','km/h, m/s, mph and knots'),icon:'i-lucide-gauge'},
  {to:'/tools/convert/fuel',title:text('อัตราสิ้นเปลือง','Fuel economy'),desc:text('กม./ลิตร และลิตร/100 กม.','km/L and L/100 km'),icon:'i-lucide-fuel'},
  {to:'/tools/convert/bmi',title:text('ดัชนีมวลกาย','Body mass index'),desc:text('ประมาณค่าจากส่วนสูงและน้ำหนัก','Estimate from height and weight'),icon:'i-lucide-heart-pulse'},
  {to:'/tools/convert/bmr',title:text('พลังงานพื้นฐาน','Basal metabolic rate'),desc:text('คำนวณ BMR โดยประมาณ','Estimate your BMR'),icon:'i-lucide-activity'},
  {to:'/tools/convert/tdee',title:text('พลังงานต่อวัน','Daily energy needs'),desc:text('ประมาณพลังงานที่ใช้ในแต่ละวัน','Estimate daily energy use'),icon:'i-lucide-flame'},
])
const sections=computed(()=>[{to:'/tasks',title:text('รายการงาน','Tasks'),desc:text('งานที่ทำครั้งเดียวและงานย่อย','One-time tasks and subtasks'),icon:'i-lucide-list-todo'},{to:'/finance',title:text('การเงิน','Finances'),desc:text('บันทึกรายรับ รายจ่าย และยอดเป้าหมาย','Record income, expenses and goal contributions'),icon:'i-lucide-wallet'},{to:'/focus',title:text('โฟกัส','Focus'),desc:text('จับเวลาและเก็บ session ตามงาน','Time and record focus sessions'),icon:'i-lucide-timer'},{to:'/mood',title:text('ความรู้สึก','Mood'),desc:text('เช็กอินอารมณ์และพลังงาน','Check in with your mood and energy'),icon:'i-lucide-smile'},{to:'/settings',title:text('ตั้งค่า','Settings'),desc:text('ปรับข้อมูลและสำรองข้อมูล','Preferences and backups'),icon:'i-lucide-settings-2'}])
</script>
<template>
 <div class="page-wrap tools-page">
  <header><h1 class="page-title">{{ text('เครื่องมือสำหรับทุกวัน','Tools for everyday life') }}</h1><p class="muted mt-2 mb-0">{{ text('เปิดใช้เมื่อจำเป็น โดยไม่รบกวนหน้ากิจวัตร','Open a tool when you need it') }}</p></header>
  <section><h2 class="section-title mb-4">{{ text('ดูแลจังหวะประจำวัน','Your daily rhythm') }}</h2><div class="module-list"><NuxtLink v-for="item in sections" :key="item.to" :to="item.to" class="module-link"><UIcon :name="item.icon" class="size-5 success"/><span><strong>{{ item.title }}</strong><small class="muted">{{ item.desc }}</small></span><UIcon name="i-lucide-arrow-right" class="size-4 muted"/></NuxtLink></div></section>
  <section><h2 class="section-title mb-4">{{ t('tools') }}</h2><div class="converter-list"><NuxtLink v-for="tool in tools" :key="tool.to" :to="tool.to" class="converter-link" :class="{'featured-tool':tool.accent}"><UIcon :name="tool.icon" class="size-5"/><span><strong>{{ tool.title }}</strong><small>{{ tool.desc }}</small></span><UIcon name="i-lucide-arrow-up-right" class="size-4"/></NuxtLink></div></section>

 </div>
</template>
<style scoped>
.tools-page{display:grid;gap:36px}.module-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:32px}.module-link{display:flex;align-items:center;gap:16px;min-height:88px;padding:16px 4px;border-bottom:1px solid var(--mh-line);color:var(--mh-ink);text-decoration:none}.module-link>span:not(.iconify),.converter-link>span:not(.iconify){flex:1;min-width:0}.module-link strong,.converter-link strong{display:block;font-size:1rem;font-weight:500}.module-link small,.converter-link small{display:block;margin-top:4px;font-size:.875rem}.module-link:hover{color:var(--mh-accent)}.converter-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}.converter-link{display:flex;align-items:center;gap:16px;padding:20px 8px;border-bottom:1px solid var(--mh-line);text-decoration:none;color:var(--mh-ink)}.converter-link>svg,.converter-link>.iconify{flex-shrink:0}.converter-link small{color:var(--mh-muted)}.converter-link:hover{background:var(--mh-hover)}.featured-tool{grid-column:1/-1;background:var(--mh-accent-soft);color:var(--mh-accent);padding:24px;border:0;border-radius:14px;margin-bottom:16px}.featured-tool small{color:var(--mh-accent)}.featured-tool:hover{background:var(--mh-accent-soft)}
@media(max-width:650px){.module-list,.converter-list{grid-template-columns:minmax(0,1fr)}.tools-page{gap:28px}}
</style>
