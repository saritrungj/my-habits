<script setup lang="ts">
const {t}=useI18n()
onMounted(async()=>{await useSupabaseClient().auth.getSession();await navigateTo('/today')})
</script>
<template><div class="page-wrap"><section class="surface mx-auto grid max-w-md justify-items-center gap-3 p-7 text-center"><UIcon name="i-lucide-loader-circle" class="size-8 animate-spin accent"/><p class="m-0 text-sm">กำลังเข้าสู่ระบบ…</p><NuxtLink to="/today" class="text-sm accent">{{ t('today') }}</NuxtLink></section></div></template>
