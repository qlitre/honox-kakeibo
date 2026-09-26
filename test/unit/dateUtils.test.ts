import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTodayDate } from '@/utils/dateUtils'

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
