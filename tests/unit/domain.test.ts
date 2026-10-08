import { describe, expect, it } from 'vitest'
import { dateOffset, localDateKey, monthDays } from '../../shared/domain/dates'
import { habitsForDate, passed, tasksForDate } from '../../shared/domain/habits'
import { importLegacy } from '../../shared/domain/migrate'
import { promptPayPayload } from '../../shared/domain/promptpay'
import { splitBill } from '../../shared/domain/split-bill'
import { defaultState } from '../../shared/domain/types'

describe('Myhabit dates and recurring routines', () => {
  it('handles day rollover and leap years in calendar keys', () => {
    expect(localDateKey(new Date('2026-01-01T16:30:00Z'))).toBe('2026-01-01')
    expect(dateOffset('2024-02-28', 1)).toBe('2024-02-29')
    expect(monthDays('2024-02')).toBe(29)
  })

  it('uses weekday recurrence without mixing tasks into the habit pass threshold', () => {
    const state = defaultState()
    state.habits = [{ id: 'weekly', title: 'Walk', slot: 'morning', active: true, createdAt: '2026-01-01T00:00:00Z', recurrence: { type: 'weekly', weekdays: [1] } }]
    state.settings.passThreshold = 1
    state.tasks = [{ id: 'task', title: 'Report', date: '2026-10-12', status: 'todo', priority: 'med', subtasks: [], createdAt: '2026-10-05T00:00:00Z' }]
    expect(habitsForDate(state, '2026-10-12').map(habit => habit.id)).toEqual(['weekly'])
    expect(habitsForDate(state, '2026-10-13')).toEqual([])
    expect(tasksForDate(state, '2026-10-12')).toHaveLength(1)
    expect(passed({ habitIds: ['weekly'], done: { weekly: true }, threshold: 1, rest: false })).toBe(true)
  })
})

describe('legacy import', () => {
  it('imports Sprout task, weekly habit, checklist data and goal entries', async () => {
    const imported = await importLegacy({
      app: 'sprout-planner', version: 1,
      state: {
        tasks: {
          walk: { title: 'Walk', isTemplate: true, recurrence: { type: 'weekly', weekdays: [1, 3] } },
          report: { title: 'Report', workStatus: 'todo', subtasks: [{ id: 'draft', title: 'Draft' }] },
          savings: { title: 'Savings', goalType: 'financial', goalTitle: 'Travel', goalConfig: { target: 5000, startingBalance: 500 }, goalRecords: {} }
        },
        templates: ['walk'],
        days: { '2026-10-05': { taskIds: ['walk', 'report'], done: { walk: true }, subtasksDone: { report: { draft: true } }, doneAt: { report: '2026-10-05T08:00:00Z' }, goalRecords: { savings: { type: 'financial', income: 100, expense: 20 } }, goalEntries: { savings: 100 } } }
      }
    })
    expect(imported.habits.find(habit => habit.id === 'walk')?.recurrence).toEqual({ type: 'weekly', weekdays: [1, 3] })
    expect(imported.tasks[0]?.legacyId).toBe('report')
    expect(imported.tasks[0]?.date).toBe('2026-10-05')
    expect(imported.subtasksDone['2026-10-05']?.report?.draft).toBe(true)
    expect(imported.doneAt['2026-10-05']?.report).toBe('2026-10-05T08:00:00Z')
    expect(imported.financeEntries.reduce((sum, entry) => sum + entry.amountMinor, 0)).toBe(12000)
    expect(imported.financeEntries.map(entry => entry.kind)).toEqual(['income', 'expense'])
  })

  it('uses legacy goalEntries only when a canonical goal record is absent', async () => {
    const imported = await importLegacy({
      app: 'sprout-planner',
      state: {
        tasks: {
          savings: { title: 'Savings', goalType: 'financial', goalConfig: { target: 5000 } },
          weight: { title: 'Weight', goalType: 'weight', goalConfig: { target: 60 } }
        },
        days: {
          '2026-10-05': { goalEntries: { savings: 100, weight: 72 } },
          '2026-10-06': { goalRecords: { savings: { type: 'financial', income: 25 } }, goalEntries: { savings: 100 } }
        }
      }
    })
    expect(imported.financeEntries).toHaveLength(2)
    expect(imported.financeEntries.map(entry => entry.amountMinor)).toEqual([10000, 2500])
    expect(imported.goalEntries).toHaveLength(1)
    expect(imported.goalEntries[0]).toMatchObject({ goalId: 'sprout-goal:weight', value: 72 })
  })

  it('sanitizes a wrapped Myhabit backup and remains safe for malformed JSON input', async () => {
    const source = defaultState()
    source.tasks.push({ id: 'task-1', title: 'Read', date: '2026-10-08', status: 'todo', priority: 'low', subtasks: [], createdAt: '2026-10-08T00:00:00Z' })
    expect((await importLegacy({ app: 'myhabit', state: source })).tasks).toHaveLength(1)
    expect((await importLegacy(null)).habits.length).toBeGreaterThan(0)
  })
})

describe('local money tools', () => {
  it('distributes each remaining satang once and supports weighted shares', () => {
    const split = splitBill({ amountMinor: 10_000, people: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }] })
    expect(split.people.map(person => person.amountMinor)).toEqual([3334, 3333, 3333])
    expect(split.people.reduce((sum, person) => sum + person.amountMinor, 0)).toBe(split.totalMinor)
    const weighted = splitBill({ amountMinor: 900, people: [{ id: 'a', name: 'A', share: 2 }, { id: 'b', name: 'B' }] })
    expect(weighted.people.map(person => person.amountMinor)).toEqual([600, 300])
    expect(() => splitBill({ amountMinor: Number.MAX_SAFE_INTEGER, people: [{ id: 'a', name: 'A' }], serviceRate: 1, vatRate: 1 })).toThrow(RangeError)
  })

  it('applies service charge before VAT and validates PromptPay identifiers locally', () => {
    const split = splitBill({ amountMinor: 10_000, people: [{ id: 'a', name: 'A' }], serviceRate: .1, vatRate: .07 })
    expect(split.serviceMinor).toBe(1000)
    expect(split.vatMinor).toBe(770)
    expect(split.totalMinor).toBe(11770)
    const payload = promptPayPayload('0812345678', 'phone', 11770)
    expect(payload).toContain('0066812345678')
    expect(payload).toContain('5406117.70')
    expect(payload.slice(-8, -4)).toBe('6304')
    expect(() => promptPayPayload('12345', 'phone')).toThrow(RangeError)
  })
})
