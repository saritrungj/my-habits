export function useFeedback() {
  const toast = useToast()
  const ownerId = useState<string>('workspace-owner', () => 'guest')
  const { locale } = useI18n()
  const previous = useState<string | number | undefined>('feedback-toast', () => undefined)
  function notify(th: string, en: string, undo?: () => void) {
    if (previous.value !== undefined) toast.remove(previous.value!)
    const owner = ownerId.value
    const entry = toast.add({
      title: locale.value === 'th' ? th : en,
      color: 'success', icon: 'i-lucide-circle-check', duration: undo ? 0 : 4000,
      progress: false,
      actions: undo ? [{ label: locale.value === 'th' ? 'เลิกทำ' : 'Undo', color: 'neutral', variant: 'outline', class: 'min-h-11', onClick: () => { if (ownerId.value === owner) undo(); toast.remove(entry.id) } }] : []
    })
    previous.value = entry.id
  }
  watch(ownerId, () => { if (previous.value !== undefined) toast.remove(previous.value!) })
  return { notify }
}
