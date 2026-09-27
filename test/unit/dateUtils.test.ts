import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTodayDate, getYearMonth } from '@/utils/dateUtils'

describe('getTodayDate（日本時間の今日）', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it.each([
    ['2026-09-30T14:59:59Z', '2026-09-30'], // JST 23:59:59
    ['2026-09-30T15:00:00Z', '2026-10-01'], // JST 翌0:00 で日付が変わる
    ['2025-12-31T15:00:00Z', '2026-01-01'], // 年またぎ
    ['2024-02-28T15:00:00Z', '2024-02-29'], // うるう日
    ['2026-01-05T00:00:00Z', '2026-01-05'], // 1桁の月日は0埋め
  ])('UTC %s → %s', (now, expected) => {
    vi.setSystemTime(new Date(now))
    expect(getTodayDate()).toBe(expected)
  })
})

describe('getYearMonth', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('yyyy-mm-dd の年・月', () => {
    expect(getYearMonth('2026-08-31')).toEqual({ year: 2026, month: 8 })
  })

  it.each(['', 'abc', '2026-8-1', '2026/08/01'])('形式が不正（%j）なら日本時間の今月', (date) => {
    vi.setSystemTime(new Date('2026-09-30T16:00:00Z')) // JST 10/1 01:00
    expect(getYearMonth(date)).toEqual({ year: 2026, month: 10 })
  })

  it('省略すると日本時間の今月', () => {
    vi.setSystemTime(new Date('2025-12-31T15:00:00Z')) // JST 2026/1/1 00:00
    expect(getYearMonth()).toEqual({ year: 2026, month: 1 })
  })
})
