import { defaultState, type MyhabitState } from '#shared/domain/types'
import { importLegacy } from '#shared/domain/migrate'
import { normalizeWorkspace } from '#shared/domain/settings'
import { readSnapshot, writeSnapshot } from '../utils/local-store.client'

export function useWorkspace(coordinator = false) {
  const state = useState<MyhabitState>('workspace', defaultState)
  const status = useState<'loading' | 'local' | 'pending' | 'synced' | 'offline' | 'conflict' | 'error'>('workspace-status', () => 'loading')
  const revision = useState<number>('workspace-revision', () => 0)
  const ownerId = useState<string>('workspace-owner', () => 'guest')
  const initialized = useState<boolean>('workspace-initialized', () => false)
  const conflictCloud = useState<MyhabitState | null>('workspace-conflict', () => null)
  const guestImportPending = useState<boolean>('workspace-guest-import-pending', () => false)
  const legacyRowsPending = useState<Array<{day:string;habits:Record<string,boolean>}>>('legacy-habit-rows',()=>[])
  const syncHold = useState('workspace-sync-hold',()=>false)
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const cloudWritesReady = Boolean(useRuntimeConfig().public.workspaceV3Ready)
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let syncTimer: ReturnType<typeof setTimeout> | undefined
  let generation = 0

  const hasUserData = (value: MyhabitState) => Boolean(value.tasks.length || value.goals.length || value.goalEntries.length || Object.keys(value.habitDays).length || Object.keys(value.dayNotes).length || Object.keys(value.subtasksDone).length || Object.keys(value.doneAt).length || value.financeEntries.length || value.focusSessions.length || value.moodEntries.length || value.billDrafts.length || value.habits.some(habit => !habit.legacy))

  async function persist() {
    if (!import.meta.client || !initialized.value || status.value === 'loading') return
    if (ownerId.value !== 'guest' && (guestImportPending.value || status.value === 'conflict')) return
    try {
      const snapshot = JSON.parse(JSON.stringify(state.value)) as MyhabitState
      await writeSnapshot(ownerId.value, snapshot, revision.value)
      if (status.value !== 'synced' && status.value !== 'conflict') status.value = ownerId.value === 'guest' ? 'local' : navigator.onLine ? 'pending' : 'offline'
      if (ownerId.value !== 'guest' && navigator.onLine && status.value !== 'conflict' && !syncHold.value && !guestImportPending.value && !legacyRowsPending.value.length) scheduleSync()
    } catch { status.value = 'error' }
  }

  function scheduleSync() {
    if (!coordinator || !cloudWritesReady) return
    clearTimeout(syncTimer)
    syncTimer = setTimeout(() => void syncNow(), 550)
  }

  async function syncNow() {
    if (!cloudWritesReady) return
    if (!import.meta.client || ownerId.value === 'guest' || !navigator.onLine || status.value === 'conflict' || syncHold.value || guestImportPending.value || legacyRowsPending.value.length > 0) return
    status.value = 'pending'
    const generationAtStart = generation
    const mutationId = crypto.randomUUID()
    const { data, error } = await client.rpc('myhabit_save_workspace', {
      p_payload: JSON.parse(JSON.stringify({ ...state.value, billDrafts: [] })),
      p_expected_revision: revision.value,
      p_mutation_id: mutationId
    })
    if (generationAtStart !== generation) return
    if (error) {
      if (error.code === '40001') {
        await fetchCloud(true)
        return
      }
      status.value = 'error'
      return
    }
    const row = Array.isArray(data) ? data[0] : data
    revision.value = Number(row?.revision ?? revision.value + 1)
    await writeSnapshot(ownerId.value, JSON.parse(JSON.stringify(state.value)) as MyhabitState, revision.value)
    status.value = 'synced'
  }

  async function fetchCloud(makeConflict = false) {
    if (!user.value) return null
    const { data, error } = await client.from('myhabit_workspaces').select('payload,revision').eq('user_id', user.value.id).maybeSingle()
    if (error) throw error
    if (!data) { revision.value = 0; return null }
    const cloud = normalizeWorkspace(data.payload)
    revision.value = Number(data.revision)
    if (makeConflict && hasUserData(state.value) && JSON.stringify(cloud) !== JSON.stringify(state.value)) {
      conflictCloud.value = cloud
      status.value = 'conflict'
      return cloud
    }
    return cloud
  }

  async function switchAccount(id: string | null) {
    const token = ++generation
    ownerId.value = id ?? 'guest'
    conflictCloud.value = null
    guestImportPending.value = false
    legacyRowsPending.value = []
    syncHold.value = true
    status.value = 'loading'
    try {
      if (!id) {
        const local = await readSnapshot('guest')
        if (token !== generation) return
        state.value = local?.state ? normalizeWorkspace(local.state) : defaultState()
        revision.value = local?.revision ?? 0
        status.value = 'local'
        syncHold.value = false
        return
      }
      const guest = await readSnapshot('guest')
      const account = await readSnapshot(id)
      if (token !== generation) return
      revision.value = account?.revision ?? 0
      // An unavailable cloud must never prevent an account's local snapshot from opening.
      let cloud: MyhabitState | null = null
      if (navigator.onLine) { try { cloud = await fetchCloud() } catch { /* Continue with the account's local copy. */ } }
      if (token !== generation) return
      const best = cloud ? { ...cloud, billDrafts: account?.state.billDrafts ?? [] } : account?.state ? normalizeWorkspace(account.state) : null
      if (guest?.state && hasUserData(guest.state)) {
        if (!best) {
          state.value = normalizeWorkspace(guest.state)
          guestImportPending.value = true
          status.value = 'pending'
        } else if (JSON.stringify(best) !== JSON.stringify(guest.state)) {
          state.value = normalizeWorkspace(guest.state)
          conflictCloud.value = best
          status.value = 'conflict'
        } else {
          state.value = best
          status.value = 'synced'
        }
      } else {
        state.value = best ?? defaultState()
        status.value = cloud ? 'synced' : best ? navigator.onLine ? 'pending' : 'offline' : 'local'
      }
      if (navigator.onLine && !state.value.legacySources.myhabitCloudImported) {
        const { data: legacyRows, error: legacyError } = await client.from('habit_days').select('day,habits').order('day')
        if (!legacyError && legacyRows?.length && token === generation) legacyRowsPending.value = legacyRows.map(row => ({ day: row.day, habits: Object.fromEntries(Object.entries(row.habits && typeof row.habits === 'object' && !Array.isArray(row.habits) ? row.habits : {}).map(([id, done]) => [id, Boolean(done)])) }))
      }
      if (token === generation) syncHold.value = false
    } catch { if (token === generation) { status.value = 'error'; syncHold.value = false } }
  }

  async function chooseConflict(source: 'local' | 'cloud') {
    const alternate = conflictCloud.value
    if (!alternate) return
    if (source === 'cloud') state.value = alternate
    conflictCloud.value = null
    status.value = 'pending'
    await persist()
    await syncNow()
  }

  async function importGuest() {
    guestImportPending.value = false
    await persist()
    await syncNow()
  }

  async function importLegacyRows() {
    if (!legacyRowsPending.value.length) return
    syncHold.value = true
    const imported = await importLegacy({ habitDays: Object.fromEntries(legacyRowsPending.value.map(row=>[row.day,row.habits])) })
    state.value = { ...state.value, habits: state.value.habits.map(habit=>({...habit,legacy:true})), habitDays: {...imported.habitDays,...state.value.habitDays}, legacySources: {...state.value.legacySources,myhabitCloudImported:new Date().toISOString()} }
    legacyRowsPending.value = []
    syncHold.value = false
    await persist()
    await syncNow()
  }

  onMounted(async () => {
    if (!coordinator || initialized.value) return
    try {
      const snapshot = await readSnapshot('guest')
      if (snapshot) { state.value = normalizeWorkspace(snapshot.state); revision.value = snapshot.revision }
      else {
        const oldPlanner = localStorage.getItem('sprout-planner:v1')
        const oldHabitDays = localStorage.getItem('habits-v1')
        const oldBill = localStorage.getItem('hanTaoGunData')
        if (oldPlanner || oldHabitDays || oldBill) {
          let oldBillEncrypted = localStorage.getItem('hanTaoGunDataEncrypted') === 'true'
          if (oldBill && !oldBillEncrypted) { try { JSON.parse(oldBill) } catch { oldBillEncrypted = true } }
          let oldState: unknown = {}
          if (oldPlanner) { try { oldState=JSON.parse(oldPlanner) } catch { state.value.migrationWarnings.push('อ่านข้อมูล Sprout ในอุปกรณ์ไม่ได้') } }
          state.value=await importLegacy(oldState,{localHabits:oldHabitDays,oldBill:oldBill?{value:oldBill,encrypted:oldBillEncrypted}:null})
        }
      }
    } catch { status.value = 'error' }
    initialized.value = true
    if (user.value) await switchAccount(user.value.id)
    else if (status.value !== 'error') status.value = 'local'
  })

  watch(() => user.value?.id ?? null, async (id, previous) => {
    if (!coordinator || !initialized.value || id === previous) return
    await switchAccount(id)
  })
  watch(state, () => {
    if (!coordinator || !initialized.value) return
    if (!['conflict', 'loading', 'error'].includes(status.value)) status.value = ownerId.value === 'guest' ? 'local' : 'pending'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void persist(), 180)
  }, { deep: true })
  onMounted(() => {
    if (!coordinator) return
    const handleOnline = () => { if (ownerId.value !== 'guest') scheduleSync(); else if (status.value !== 'error') status.value = 'local' }
    const handleOffline = () => { if (ownerId.value !== 'guest') status.value = 'offline' }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    onBeforeUnmount(() => {
      clearTimeout(saveTimer); clearTimeout(syncTimer)
      window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline)
    })
  })

  function touch() { if (!['conflict', 'loading', 'error'].includes(status.value)) status.value = ownerId.value === 'guest' ? 'local' : 'pending'; void persist() }
  return { state, status, user, revision, ownerId, initialized, conflictCloud, guestImportPending, legacyRowsPending, hasUserData, touch, flushLocal: persist, syncNow, chooseConflict, importGuest, importLegacyRows }
}
