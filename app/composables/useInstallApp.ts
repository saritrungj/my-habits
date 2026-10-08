type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted'|'dismissed' }> }
export function useInstallApp() {
  const available = useState('install-available', () => false)
  const installed = useState('app-installed', () => false)
  const event = useState<InstallEvent | null>('install-event', () => null)
  const busy = ref(false)
  const { notify } = useFeedback()
  async function install() {
    if (!event.value || busy.value) return
    busy.value = true
    try { await event.value.prompt(); const choice = await event.value.userChoice; if(choice.outcome==='accepted')notify('ติดตั้ง Myhabit แล้ว','Myhabit installed') }
    finally { available.value = false; event.value = null; busy.value = false }
  }
  return { available, installed, busy, event, install }
}
