<script setup lang="ts">
const route=useRoute()
const destinations:Record<string,string>={'hub':'/today','planner':'/today','planner/today':'/today','planner/calendar':'/progress','planner/dashboard':'/progress','planner/settings':'/settings','app':'/today','work':'/tasks','work/list':'/tasks','work/board':'/tasks','work/settings':'/settings','goals/settings':'/settings','finance/settings':'/settings','focus/settings':'/settings','mood/settings':'/settings'}
const path=Array.isArray(route.params.slug)?route.params.slug.join('/'):String(route.params.slug??'')
await navigateTo(destinations[path]??'/today',{replace:true})
</script>
<template><div class="page-wrap"><p class="muted">กำลังเปิด Myhabit…</p></div></template>
