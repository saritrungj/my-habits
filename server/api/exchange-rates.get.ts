import { parseExchangeRates, type ExchangeSnapshot } from '../../shared/domain/exchange'

export default defineCachedEventHandler(async (): Promise<ExchangeSnapshot> => {
  try {
    const rows: unknown = await $fetch<unknown>('https://api.frankfurter.dev/v2/rates', {
      query: { base: 'EUR', quotes: 'THB,USD,JPY,GBP', providers: 'ECB' },
      timeout: 10_000, retry: 1
    })
    return parseExchangeRates(rows)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Exchange rates temporarily unavailable' })
  }
}, { name: 'ecb-exchange-rates', maxAge: 3600, swr: false })
