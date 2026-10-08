import { exchangeAmount, type ExchangeSnapshot } from './exchange'
export type Unit = { id: string; label: string; factor?: number; offset?: number }
export type ConverterKind = 'length' | 'weight' | 'volume' | 'temperature' | 'time' | 'speed' | 'fuel' | 'currency' | 'bmi' | 'bmr' | 'tdee'

export const unitSets: Record<Exclude<ConverterKind, 'bmi' | 'bmr' | 'tdee'>, Unit[]> = {
  length: [{ id: 'm', label: 'เมตร', factor: 1 }, { id: 'km', label: 'กิโลเมตร', factor: 1000 }, { id: 'cm', label: 'เซนติเมตร', factor: .01 }, { id: 'mi', label: 'ไมล์', factor: 1609.344 }, { id: 'ft', label: 'ฟุต', factor: .3048 }, { id: 'in', label: 'นิ้ว', factor: .0254 }],
  weight: [{ id: 'kg', label: 'กิโลกรัม', factor: 1 }, { id: 'g', label: 'กรัม', factor: .001 }, { id: 'lb', label: 'ปอนด์', factor: .45359237 }, { id: 'oz', label: 'ออนซ์', factor: .028349523125 }],
  volume: [{ id: 'l', label: 'ลิตร', factor: 1 }, { id: 'ml', label: 'มิลลิลิตร', factor: .001 }, { id: 'cup', label: 'ถ้วย (US)', factor: .2365882365 }, { id: 'gal', label: 'แกลลอน (US)', factor: 3.785411784 }],
  temperature: [{ id: 'c', label: '°C' }, { id: 'f', label: '°F' }, { id: 'k', label: 'K' }],
  time: [{ id: 'min', label: 'นาที', factor: 60 }, { id: 'h', label: 'ชั่วโมง', factor: 3600 }, { id: 'day', label: 'วัน', factor: 86400 }, { id: 'sec', label: 'วินาที', factor: 1 }],
  speed: [{ id: 'kmh', label: 'กม./ชม.', factor: 1 }, { id: 'ms', label: 'ม./วินาที', factor: 3.6 }, { id: 'mph', label: 'ไมล์/ชม.', factor: 1.609344 }, { id: 'knot', label: 'นอต', factor: 1.852 }],
  fuel: [{ id: 'l100', label: 'ลิตร/100 กม.', factor: 1 }, { id: 'kml', label: 'กม./ลิตร', factor: 1 }],
  currency: [{ id: 'THB', label: 'THB' }, { id: 'USD', label: 'USD' }, { id: 'EUR', label: 'EUR' }, { id: 'JPY', label: 'JPY' }, { id: 'GBP', label: 'GBP' }]
}

export function convert(value: number, kind: ConverterKind, from: string, to: string, snapshot?: ExchangeSnapshot): number {
  if (!Number.isFinite(value)) throw new RangeError('Enter a valid number.')
  const units = unitSets[kind as keyof typeof unitSets]
  const source = units?.find(unit => unit.id === from)
  const target = units?.find(unit => unit.id === to)
  if (!source || !target) throw new Error('Unsupported unit.')
  if (kind === 'temperature') {
    const c = from === 'f' ? (value - 32) * 5 / 9 : from === 'k' ? value - 273.15 : value
    if (c < -273.15) throw new RangeError('Temperature must be at or above absolute zero.')
    return to === 'f' ? c * 9 / 5 + 32 : to === 'k' ? c + 273.15 : c
  }
  if (kind === 'currency') { if (!snapshot) throw new Error('Load exchange rates before converting.'); return exchangeAmount(value, from, to, snapshot) }
  if (kind === 'fuel') { if (value <= 0) throw new RangeError('Fuel economy must be greater than zero.'); return from === to ? value : 100 / value }
  if (source.factor === undefined || target.factor === undefined) throw new Error('Unsupported unit.')
  const result = value * source.factor / target.factor
  if (!Number.isFinite(result)) throw new RangeError('Value is too large to convert.')
  return result
}

export function healthEstimate(kind: 'bmi' | 'bmr' | 'tdee', input: { heightCm: number; weightKg: number; age: number; sex: 'female' | 'male'; activity: number }) {
  const { heightCm, weightKg, age, sex, activity } = input
  if (![heightCm, weightKg, age, activity].every(Number.isFinite) || heightCm <= 0 || weightKg <= 0 || age < 1 || age > 120 || activity <= 0 || !['female','male'].includes(sex)) throw new RangeError('Check the height, weight, age and activity inputs.')
  if (kind === 'bmi') return weightKg / ((heightCm / 100) ** 2)
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
  return kind === 'bmr' ? bmr : bmr * activity
}
