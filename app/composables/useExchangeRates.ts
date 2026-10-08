import { validExchangeSnapshot, type ExchangeSnapshot } from '#shared/domain/exchange'

export function useExchangeRates() {
  const snapshot = useState<ExchangeSnapshot | null>('exchange-snapshot', () => null)
  const loading = useState('exchange-loading', () => false)
  const cached = useState('exchange-cached', () => false)
  const failed = useState('exchange-failed', () => false)
  async function refresh() {
    if (loading.value || !import.meta.client) return
    loading.value = true
    failed.value = false
    if (!snapshot.value) {
      try { const saved = JSON.parse(localStorage.getItem('myhabit-ecb-rates') || 'null'); if (validExchangeSnapshot(saved)) { snapshot.value = saved; cached.value = true } } catch { /* Invalid local cache is ignored. */ }
    }
    try {
      const data = await $fetch<ExchangeSnapshot>('/api/exchange-rates', { timeout: 25_000 })
      if (!validExchangeSnapshot(data)) throw new Error('Invalid exchange rates')
      snapshot.value = data
      cached.value = false
      try { localStorage.setItem('myhabit-ecb-rates', JSON.stringify(data)) } catch { /* Rates still work when storage is unavailable. */ }
    } catch { failed.value = true; cached.value = Boolean(snapshot.value) }
    finally { loading.value = false }
  }
  return { snapshot, loading, cached, failed, refresh }
}
