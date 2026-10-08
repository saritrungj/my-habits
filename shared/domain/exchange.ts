export const currencies = ['THB', 'USD', 'EUR', 'JPY', 'GBP'] as const
export type Currency = typeof currencies[number]
export type ExchangeSnapshot = { base: 'EUR'; date: string; fetchedAt: string; provider: 'ECB'; rates: Record<Currency, number> }

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value
}

export function parseExchangeRates(input: unknown, now = new Date()): ExchangeSnapshot {
  if (!Array.isArray(input)) throw new Error('Invalid exchange-rate response')
  const rates = { EUR: 1 } as Record<Currency, number>
  const dates = new Set<string>()
  for (const quote of currencies.filter(code => code !== 'EUR')) {
    const row = input.find(row => row?.base === 'EUR' && row?.quote === quote)
    if (!row || typeof row.rate !== 'number' || !Number.isFinite(row.rate) || row.rate <= 0 || !validDate(row.date) || row.date > now.toISOString().slice(0, 10)) throw new Error('Incomplete or invalid exchange rates')
    rates[quote] = row.rate
    dates.add(row.date)
  }
  if (dates.size !== 1) throw new Error('Exchange rates have inconsistent dates')
  return { base: 'EUR', date: [...dates][0]!, fetchedAt: now.toISOString(), provider: 'ECB', rates }
}

export function validExchangeSnapshot(input: unknown): input is ExchangeSnapshot {
  const row = input as ExchangeSnapshot | null
  return Boolean(row && row.base === 'EUR' && row.provider === 'ECB' && validDate(row.date) && row.date <= new Date().toISOString().slice(0,10) && Number.isFinite(Date.parse(row.fetchedAt)) && currencies.every(code => Number.isFinite(row.rates?.[code]) && row.rates[code] > 0) && row.rates.EUR === 1)
}

export function exchangeAmount(amount: number, from: string, to: string, snapshot: ExchangeSnapshot): number {
  if (!Number.isFinite(amount) || !validExchangeSnapshot(snapshot) || !currencies.includes(from as Currency) || !currencies.includes(to as Currency)) throw new Error('Invalid amount or currency')
  const result = amount / snapshot.rates[from as Currency] * snapshot.rates[to as Currency]
  if (!Number.isFinite(result)) throw new RangeError('Amount is too large')
  return result
}
