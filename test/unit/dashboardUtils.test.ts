import { describe, expect, it } from 'vitest'
import {
  accumulate,
  getBeginningOfMonth,
  getEndOfMonth,
  getPrevMonth,
  getPrevMonthYear,
} from '@/utils/dashboardUtils'

// Phase 0 の実証（unitプロジェクトが動くこと）。網羅はPhase 1で行う

describe('dashboardUtils', () => {
  it('1月の前月は前年12月', () => {
    expect(getPrevMonth(1)).toBe(12)
    expect(getPrevMonthYear(2026, 1)).toBe(2025)
  })

  it('月初・月末（うるう年の2月）', () => {
    expect(getBeginningOfMonth(2024, 2)).toBe('2024-02-01')
    expect(getEndOfMonth(2024, 2)).toBe('2024-02-29')
  })

  it('累積和', () => {
    expect(accumulate([1, 2, 3])).toEqual([1, 3, 6])
    expect(accumulate([])).toEqual([])
  })
})
