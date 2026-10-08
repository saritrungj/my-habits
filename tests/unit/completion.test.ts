import { describe, expect, it } from 'vitest'
import { parseExchangeRates, validExchangeSnapshot, exchangeAmount } from '../../shared/domain/exchange'
import { readTimerSnapshot, timerRemaining } from '../../shared/domain/focus-timer'
import { goalCurrent, goalProgress } from '../../shared/domain/goals'
import { convert, healthEstimate, type ConverterKind } from '../../shared/domain/converters'
import { defaultState, type Goal } from '../../shared/domain/types'

const now = new Date('2026-10-08T12:00:00Z')
const rows = [['THB', 40], ['USD', 1.2], ['JPY', 160], ['GBP', .8]].map(([quote, rate]) => ({ base: 'EUR', quote, rate, date: '2026-10-07' }))
describe('verified exchange rates', () => {
  it('converts cross rates in both directions without treating THB as the base', () => {
    const rates = parseExchangeRates(rows, now)
    expect(exchangeAmount(400, 'THB', 'USD', rates)).toBe(12)
    expect(exchangeAmount(12, 'USD', 'THB', rates)).toBe(400)
    expect(exchangeAmount(1, 'GBP', 'JPY', rates)).toBe(200)
    expect(convert(400, 'currency', 'THB', 'USD', rates)).toBe(12)
  })
  it('rejects incomplete, mismatched, impossible, future and nonpositive quotes', () => {
    expect(() => parseExchangeRates(rows.slice(1), now)).toThrow()
    for (const change of [{ rate: 0 }, { rate: Infinity }, { date: '2026-02-31' }, { date: '2026-10-09' }, { date: '2026-10-06' }]) {
      expect(() => parseExchangeRates([{ ...rows[0], ...change }, ...rows.slice(1)], now)).toThrow()
    }
    const rates = parseExchangeRates(rows, now)
    expect(validExchangeSnapshot({ ...rates, date: '2026-02-31' })).toBe(false)
    expect(validExchangeSnapshot({ ...rates, rates: { ...rates.rates, EUR: 2 } })).toBe(false)
    expect(() => exchangeAmount(Infinity, 'THB', 'USD', rates)).toThrow()
    expect(() => exchangeAmount(1, 'xxx', 'USD', rates)).toThrow()
  })
})
describe('restorable clocks', () => {
  const timer = { version: 1 as const, id: 'session', phase: 'focus' as const, running: true, remaining: 60, duration: 60, deadline: now.getTime() + 60000, startedAt: now.toISOString(), selectedTask: '' }
  it('reconstructs elapsed time and keeps a paused clock stationary', () => {
    expect(readTimerSnapshot(timer)).toEqual(timer)
    expect(timerRemaining(timer, now.getTime() + 20500)).toBe(40)
    expect(timerRemaining(timer, now.getTime() + 90000)).toBe(0)
    expect(timerRemaining({ ...timer, running: false, remaining: 30 }, now.getTime() + 90000)).toBe(30)
  })
  it('rejects broken clocks and missing session identity', () => {
    for (const change of [{ duration: -1 }, { remaining: 61 }, { deadline: NaN }, { id: '' }, { startedAt: 'invalid' }]) expect(readTimerSnapshot({ ...timer, ...change })).toBeNull()
  })
})
describe('goal progress and physical conversions', () => {
  it.each([
    ['length', 'km', 'm', 1, 1000], ['weight', 'kg', 'g', 1, 1000], ['volume', 'l', 'ml', 1, 1000],
    ['time', 'h', 'min', 1, 60], ['speed', 'kmh', 'ms', 36, 10], ['fuel', 'l100', 'kml', 5, 20]
  ])('converts %s with known reference values', (kind, from, to, amount, expected) => {
    expect(convert(Number(amount), kind as ConverterKind, String(from), String(to))).toBeCloseTo(Number(expected))
  })
  it('keeps estimates finite and validates invalid health input', () => {
    const input = { heightCm: 175, weightKg: 70, age: 30, sex: 'male' as const, activity: 1.2 }
    expect(healthEstimate('bmi', input)).toBeCloseTo(22.85714)
    expect(healthEstimate('bmr', input)).toBeCloseTo(1648.75)
    expect(healthEstimate('tdee', input)).toBeCloseTo(1978.5)
    expect(() => healthEstimate('bmi', { ...input, heightCm: 0 })).toThrow()
  })
  it('counts financial expenses and excludes unrelated currencies', () => {
    const state = defaultState()
    const goal: Goal = { id: 'g', title: 'Fund', kind: 'financial', target: 1000, startingValue: 100, unit: 'THB', createdAt: now.toISOString() }
    state.financeEntries = [{ id: 'a', goalId: 'g', date: '2026-10-07', kind: 'income', currency: 'THB', amountMinor: 30000 }, { id: 'b', goalId: 'g', date: '2026-10-07', kind: 'expense', currency: 'THB', amountMinor: 5000 }, { id: 'c', goalId: 'g', date: '2026-10-07', kind: 'income', currency: 'USD', amountMinor: 99999 }]
    expect(goalCurrent(state, goal)).toBe(350)
    expect(goalProgress(goal, 350)).toBe(.35)
    expect(goalProgress({ ...goal, kind: 'weight', startingValue: 80, target: 60 }, 75)).toBe(.25)
    expect(goalProgress({ ...goal, kind: 'weight', startingValue: 60, target: 80 }, 75)).toBe(.75)
  })
  it('uses the latest weight date and clamps finished goals', () => {
    const state = defaultState(), goal: Goal = { id: 'w', title: 'Weight', kind: 'weight', target: 60, startingValue: 80, unit: 'kg', createdAt: now.toISOString() }
    state.goalEntries = [{ id: 'a', goalId: 'w', date: '2026-10-08', value: 70 }, { id: 'b', goalId: 'w', date: '2026-10-07', value: 75 }]
    expect(goalCurrent(state, goal)).toBe(70)
    expect(goalProgress(goal, 55)).toBe(1)
    expect(goalProgress(goal, 85)).toBe(0)
  })
  it('rejects invalid units, overflow, impossible temperature and zero fuel economy', () => {
    expect(convert(10, 'fuel', 'kml', 'l100')).toBe(10)
    expect(convert(32, 'temperature', 'f', 'c')).toBe(0)
    expect(() => convert(0, 'fuel', 'l100', 'kml')).toThrow()
    expect(() => convert(-1, 'temperature', 'k', 'c')).toThrow()
    expect(() => convert(1, 'length', 'bad', 'm')).toThrow()
    expect(() => convert(Number.MAX_VALUE, 'length', 'km', 'cm')).toThrow()
  })
})
