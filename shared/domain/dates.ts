export const localDateKey = (date = new Date(), timeZone = 'Asia/Bangkok') => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export const dateOffset = (date: string, offset: number) => {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day + offset, 12))
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`
}

export const isDateKey=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value

export const dateLabel = (date: string, locale = 'th-TH', timezone = 'Asia/Bangkok') => {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', calendar: locale === 'th-TH' ? 'buddhist' : 'gregory' }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export const monthDays = (month: string) => {
  const [year = 1970, number = 1] = month.split('-').map(Number)
  return new Date(year, number, 0).getDate()
}
