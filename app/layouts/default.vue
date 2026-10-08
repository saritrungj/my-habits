<script setup lang="ts">
import type { MyhabitState } from '#shared/domain/types'
import { importLegacy } from '#shared/domain/migrate'
import { mergeWorkspaceBackup } from '#shared/domain/backup'
import { localDateKey } from '#shared/domain/dates'
import { reminderGroups } from '#shared/domain/daily-plan'
import { moduleRegistry } from '#shared/domain/settings'

const { t, locale, setLocale } = useI18n()
const { state, status, user, touch, syncNow, flushLocal, chooseConflict, conflictCloud, guestImportPending, importGuest, legacyRowsPending, importLegacyRows, initialized, ownerId } = useWorkspace(true)
useFocusTimer(true)
const colorMode=useColorMode()
const route=useRoute()
const moduleSettings=computed(()=>moduleRegistry.find(item=>route.path===item.route||item.route!=='/today'&&route.path.startsWith(item.route+'/'))?.id)
const client = useSupabaseClient()
const runtimeConfig = useRuntimeConfig()
const supabaseConfigured = computed(() => Boolean(runtimeConfig.public.supabaseConfigured))
const email = ref('')
const authMessage = ref('')
const authBusy = ref(false)
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()
const now = ref(new Date())
const navigation = [
  { to: '/today', key: 'today', icon: 'i-lucide-circle-check' },
  { to: '/progress', key: 'progress', icon: 'i-lucide-chart-no-axes-column-increasing' },
  { to: '/goals', key: 'goals', icon: 'i-lucide-target' },
  { to: '/tools', key: 'more', icon: 'i-lucide-grid-2x2' }
]
const desktopNavigation = [navigation[0], { to: '/tasks', key: 'tasks', icon: 'i-lucide-list-todo' }, navigation[1], navigation[2], { to: '/focus', key: 'focus', icon: 'i-lucide-timer' }, { to: '/mood', key: 'mood', icon: 'i-lucide-smile' }, { to: '/finance', key: 'income', icon: 'i-lucide-wallet' }, { to: '/tools', key: 'tools', icon: 'i-lucide-grid-2x2' }]
const themeLabel = computed(() => locale.value === 'th' ? (colorMode.value === 'dark' ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด') : (colorMode.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'))
function toggleTheme() {
  state.value.settings.theme = colorMode.value === 'dark' ? 'light' : 'dark'
  applyTheme()
  touch()
}
function isActive(to: string) { return route.path === to || route.path.startsWith(to + '/') }
const accountEmail = computed(() => user.value?.email ?? '')
const dayGreeting = computed(() => now.value.getHours() < 11 ? t('goodMorning') : now.value.getHours() < 16 ? t('goodAfternoon') : t('goodEvening'))
const syncLabel = computed(() => status.value === 'synced' ? t('synced') : status.value === 'pending' ? t('syncPending') : status.value === 'offline' ? t('offline') : status.value === 'conflict' ? t('syncConflict') : status.value === 'error' ? (locale.value==='th'?'บันทึกไม่สำเร็จ · ลองอีกครั้ง':'Saving failed · try again') : t('savedLocally'))

onMounted(() => {
  const checkReminder = () => {
    if (!initialized.value || !('Notification' in window) || Notification.permission !== 'granted') return
    try {
      const today = localDateKey(new Date(), state.value.settings.timezone)
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: state.value.settings.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
      const currentTime = `${parts.find(part => part.type === 'hour')?.value ?? '00'}:${parts.find(part => part.type === 'minute')?.value ?? '00'}`
      for(const [time,entries] of reminderGroups(state.value,today,currentTime)) {
        const key=`myhabit-reminder:${ownerId.value}:${today}:${time}`
        if(localStorage.getItem(key))continue
        const titles=entries.map(entry=>entry.module==='focus'?(locale.value==='th'?'โฟกัส':'Focus'):entry.module==='mood'?(locale.value==='th'?'เช็กอารมณ์':'Mood check-in'):entry.title)
        new Notification('Myhabit',{body:titles.join(' · ')})
        localStorage.setItem(key,'sent')
      }
    } catch { /* Notification permission may change while Myhabit is open. */ }
  }
  const timer = window.setInterval(() => { now.value = new Date(); checkReminder() }, 30_000)
  checkReminder()
  onBeforeUnmount(() => window.clearInterval(timer))
  applyTheme()
})
watch(() => [initialized.value,state.value.settings.theme,state.value.settings.language] as const, () => {
  if(!initialized.value)return
  applyTheme()
  void setLocale(state.value.settings.language)
},{immediate:true})
function applyTheme() {
  if(!import.meta.client||!initialized.value)return
  colorMode.preference=state.value.settings.theme
  document.documentElement.lang=state.value.settings.language
}

async function sendLink() {
  const clean = email.value.trim()
  if (!clean || !clean.includes('@')) { authMessage.value = 'กรอกอีเมลที่ถูกต้องก่อน' ; return }
  authBusy.value = true
  try {
  const { error } = await client.auth.signInWithOtp({ email: clean, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
  authMessage.value = error ? `ส่งลิงก์ไม่สำเร็จ: ${error.message}` : t('linkSent')
  } catch { authMessage.value = locale.value==='th'?'ส่งลิงก์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่':'Could not send the link. Check your connection and retry.' }
  finally { authBusy.value = false }
}
async function signOut() {
  await flushLocal()
  await client.auth.signOut()
}
function openImport() { fileInput.value?.click() }
async function importFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  try {
    const raw = JSON.parse(await file.text()) as MyhabitState
    const incoming = await importLegacy(raw)
    const current = state.value
    const habitIds = new Set(current.habits.map(item => item.id))
    const newHabits = incoming.habits.filter(item => !habitIds.has(item.id))
    const newTasks = incoming.tasks.filter(item => !current.tasks.some(saved=>saved.id===item.id))
    state.value = mergeWorkspaceBackup(current,incoming,(raw as any).app==='myhabit')
    authMessage.value = `${t('importSuccess')} · ${newHabits.length} ${locale.value==='th'?'กิจวัตร':'habits'} · ${newTasks.length} ${locale.value==='th'?'งาน':'tasks'} · ${Object.keys(incoming.habitDays).length} ${locale.value==='th'?'วัน':'days'}`
  } catch { authMessage.value = t('importError') }
  finally { importing.value = false; (event.target as HTMLInputElement).value = '' }
}
function exportData() {
  const backup = { app: 'myhabit', version: 3, exportedAt: new Date().toISOString(), state: state.value }
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `myhabit-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url)
}
provide('myhabit-export', exportData)
provide('myhabit-import', openImport)
</script>

<template>
  <div class="app-shell min-h-dvh">
    <a class="skip-link" href="#main-content">{{ locale==='th'?'ข้ามไปเนื้อหา':'Skip to content' }}</a>
    <header class="app-header">
      <div class="header-inner">
        <NuxtLink to="/today" class="flex items-center gap-2.5 no-underline" style="color:var(--mh-ink)">
          <span class="grid size-10 place-items-center rounded-2xl" style="background:var(--mh-accent-soft);color:var(--mh-accent)"><UIcon name="i-lucide-sprout" class="size-6" /></span>
          <span class="text-lg font-bold tracking-tight">my<span style="color:var(--mh-accent)">habit</span></span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <ClientOnly><button class="theme-toggle" :disabled="!initialized" :aria-label="themeLabel" :title="themeLabel" @click="toggleTheme"><UIcon :name="colorMode.value==='dark'?'i-lucide-sun':'i-lucide-moon'" class="size-5" /></button><template #fallback><span class="theme-toggle" aria-hidden="true" /></template></ClientOnly>
          <NuxtLink v-if="initialized&&route.path!=='/settings'" :to="moduleSettings?`/settings?section=modules&module=${moduleSettings}`:'/settings'" class="settings-link !px-3" :aria-label="locale==='th'?'ตั้งค่าโมดูล':'Module settings'"><UIcon name="i-lucide-settings-2" class="size-5"/></NuxtLink>
          <span class="hidden text-xs text-[var(--mh-muted)] sm:block" aria-live="polite">{{ syncLabel }}</span>
          <UButton v-if="user" color="neutral" variant="ghost" size="sm" class="min-h-11 min-w-11" :aria-label="accountEmail" @click="signOut"><UIcon name="i-lucide-log-out" class="size-4" /><span class="hidden max-w-32 truncate md:inline">{{ accountEmail }}</span></UButton>
          <details v-else class="relative">
            <summary class="btn-quiet list-none text-sm font-semibold"><UIcon name="i-lucide-user-round" class="size-4"/><span class="hidden sm:inline">{{ t('signIn') }}</span><span class="sm:hidden">{{ locale==='th'?'เข้าสู่ระบบ':'Sign in' }}</span></summary>
            <form class="surface soft-shadow absolute right-0 mt-2 grid w-[min(88vw,340px)] gap-3 p-4" @submit.prevent="sendLink">
              <p class="m-0 text-sm font-semibold">{{ t('signIn') }}</p>
              <input v-model="email" class="field w-full" type="email" autocomplete="email" required :placeholder="t('email')" :aria-label="t('email')" />
              <button class="btn-primary w-full" :disabled="authBusy||!supabaseConfigured">{{ authBusy ? 'กำลังส่ง…' : t('sendLink') }}</button>
              <p v-if="!supabaseConfigured" class="m-0 text-xs muted">{{ locale==='th'?'การซิงก์บัญชียังไม่เปิดใช้งาน ข้อมูลของคุณบันทึกในอุปกรณ์นี้ได้ตามปกติ':'Account sync is not enabled yet. Your data can still be saved on this device.' }}</p>
              <p v-if="authMessage" class="m-0 text-sm" aria-live="polite">{{ authMessage }}</p>
            </form>
          </details>
        </div>
      </div>
    </header>
    <aside class="desktop-sidebar">
      <p class="sidebar-greeting">{{ dayGreeting }}<span>{{ locale==='th'?'ค่อย ๆ ไป ในจังหวะของคุณ':'One day, at your own pace' }}</span></p>
      <nav :aria-label="locale==='th'?'เมนูหลัก':'Main navigation'" class="sidebar-nav">
        <NuxtLink v-for="item in desktopNavigation" :key="item.to" :to="item.to" :class="{'sidebar-active':isActive(item.to)}" :aria-current="isActive(item.to)?'page':undefined"><UIcon :name="item.icon" class="size-5"/><span>{{ item.to==='/finance'?(locale==='th'?'การเงิน':'Finances'):t(item.key) }}</span><UIcon v-if="isActive(item.to)" name="i-lucide-chevron-right" class="ml-auto size-4"/></NuxtLink>
      </nav>
      <div class="sidebar-footer"><NuxtLink to="/settings" :class="{'sidebar-active':route.path==='/settings'}"><UIcon name="i-lucide-settings-2" class="size-5"/>{{ t('settings') }}</NuxtLink><p><UIcon name="i-lucide-hard-drive" class="size-4 shrink-0"/>{{ syncLabel }}</p></div>
    </aside>
    <main id="main-content" class="app-main" tabindex="-1">
      <p v-if="user && !runtimeConfig.public.workspaceV3Ready" class="notice mx-auto max-w-[1100px] mt-4 text-sm" role="status">{{ locale==='th'?'บันทึกในอุปกรณ์แล้ว การซิงก์กำลังรออัปเดตระบบบัญชี':'Saved on this device. Cloud sync is waiting for the account system update.' }}</p>
      <div v-if="status==='conflict'" class="mx-auto mt-4 flex max-w-[1100px] flex-col gap-3 rounded-2xl border p-4 text-sm sync-notice sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0">{{ t('syncConflict') }}</p>
        <div class="flex gap-2"><button class="btn-quiet" @click="chooseConflict('local')">{{ t('chooseLocal') }}</button><button class="btn-primary" @click="chooseConflict('cloud')">{{ t('chooseCloud') }}</button></div>
      </div>
      <div v-if="guestImportPending" class="mx-auto mt-4 flex max-w-[1100px] flex-col gap-3 rounded-2xl border p-4 text-sm sync-notice sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0">พบนิสัยและประวัติในอุปกรณ์นี้ ต้องการนำเข้าบัญชีนี้ไหม</p><button class="btn-primary" @click="importGuest">นำเข้าข้อมูลในเครื่อง</button>
      </div>
      <div v-if="user && legacyRowsPending.length" class="mx-auto mt-4 flex max-w-[1100px] flex-col gap-3 rounded-2xl border p-4 text-sm sync-notice sm:flex-row sm:items-center sm:justify-between">
        <p class="m-0">พบประวัติ Myhabit เดิม {{ legacyRowsPending.length }} วันในบัญชี เลือกนำเข้าก่อนรวมกับข้อมูลใหม่นี้</p><button class="btn-primary" @click="importLegacyRows">นำเข้าประวัติเก่า</button>
      </div>
      <slot />
    </main>

    <nav class="mobile-nav fixed inset-x-0 bottom-0 z-30 border-t px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2" :aria-label="locale==='th'?'เมนูหลัก':'Main navigation'" style="border-color:var(--mh-line);background:var(--mh-surface)">
      <div class="mx-auto grid max-w-[680px] grid-cols-4 gap-1">
        <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to" class="grid min-h-12 justify-items-center gap-0.5 rounded-xl py-1 text-xs no-underline transition-colors" active-class="nav-active" style="color:var(--mh-muted)">
          <UIcon :name="item.icon" class="size-5" /><span>{{ t(item.key) }}</span>
        </NuxtLink>
      </div>
    </nav>
    <input ref="fileInput" class="hidden" type="file" accept="application/json,.json" @change="importFile">
    <div v-if="authMessage" class="fixed bottom-20 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-sm surface" role="status">{{ authMessage }}<button class="ml-3 underline" @click="authMessage=''">{{ locale==='th'?'ปิด':'Close' }}</button></div>
    <span class="sr-only">{{ importing ? 'กำลังนำเข้าข้อมูล' : '' }}</span>
  </div>
</template>

<style scoped>
.sync-notice{background:var(--mh-warning-soft);color:var(--mh-warning);border-color:var(--mh-warning)}
.nav-active { color: var(--mh-accent) !important; background: var(--mh-accent-soft); font-weight: 700; }
</style>
