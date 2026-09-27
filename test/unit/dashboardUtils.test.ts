import { describe, expect, it, vi } from 'vitest'
import {
  accumulate,
  formatDiff,
  getAnnualStartYear,
  getBeginningOfMonth,
  getEndOfMonth,
  getNextMonth,
  getNextMonthYear,
  getPrevMonth,
  getPrevMonthYear,
  ratio,
} from '@/utils/dashboardUtils'

// 注意: getBeginningOfMonth / getEndOfMonth は実行環境のTZに依存する。
// unitプロジェクトは本番（workerd）と同じ UTC で実行している。

describe('前月・翌月', () => {
  it.each([
    [2026, 1, 2025, 12],
    [2026, 2, 2026, 1],
    [2026, 12, 2026, 11],
  ])('%i年%i月の前月は %i年%i月', (y, m, py, pm) => {
    expect(getPrevMonthYear(y, m)).toBe(py)
    expect(getPrevMonth(m)).toBe(pm)
  })

  it.each([
    [2026, 12, 2027, 1],
    [2026, 11, 2026, 12],
    [2026, 1, 2026, 2],
  ])('%i年%i月の翌月は %i年%i月', (y, m, ny, nm) => {
    expect(getNextMonthYear(y, m)).toBe(ny)
    expect(getNextMonth(m)).toBe(nm)
  })
})

describe('月初・月末', () => {
  it.each([
    [2026, 1, '2026-01-01', '2026-01-31'],
    [2026, 2, '2026-02-01', '2026-02-28'],
    [2024, 2, '2024-02-01', '2024-02-29'], // うるう年
    [2100, 2, '2100-02-01', '2100-02-28'], // 100で割り切れる年は平年
    [2000, 2, '2000-02-01', '2000-02-29'], // 400で割り切れる年はうるう年
    [2026, 4, '2026-04-01', '2026-04-30'],
    [2026, 12, '2026-12-01', '2026-12-31'],
  ])('%i年%i月: %s 〜 %s', (y, m, begin, end) => {
    expect(getBeginningOfMonth(y, m)).toBe(begin)
    expect(getEndOfMonth(y, m)).toBe(end)
  })
})

describe('getAnnualStartYear', () => {
  it('年度開始月が1月（現在の設定）なら常に同じ年', () => {
    expect(getAnnualStartYear(2026, 1)).toBe(2026)
    expect(getAnnualStartYear(2026, 12)).toBe(2026)
  })

  it('年度開始月が4月なら、1〜3月は前年度になる', async () => {
    vi.resetModules()
    vi.doMock('@/settings/kakeiboSettings', () => ({ annualStartMonth: 4 }))
    const { getAnnualStartYear: fn } = await import('@/utils/dashboardUtils')
    expect(fn(2026, 3)).toBe(2025)
    expect(fn(2026, 4)).toBe(2026)
    expect(fn(2026, 12)).toBe(2026)
    vi.doUnmock('@/settings/kakeiboSettings')
  })
})

describe('accumulate', () => {
  it('累積和を返す', () => {
    expect(accumulate([1, 2, 3])).toEqual([1, 3, 6])
    expect(accumulate([100, -30, 0])).toEqual([100, 70, 70])
  })

  it('空配列・1要素', () => {
    expect(accumulate([])).toEqual([])
    expect(accumulate([5])).toEqual([5])
  })

  it('入力を破壊しない', () => {
    const input = [1, 2]
    accumulate(input)
    expect(input).toEqual([1, 2])
  })
})

describe('formatDiff', () => {
  it('正は + と青、負は - と赤', () => {
    expect(formatDiff(10)).toEqual({ sign: '+', color: 'text-blue-500' })
    expect(formatDiff(-10)).toEqual({ sign: '-', color: 'text-red-500' })
  })

  it('0 は + 扱い', () => {
    expect(formatDiff(0)).toEqual({ sign: '+', color: 'text-blue-500' })
  })
})

describe('ratio', () => {
  it('分子 / 分母', () => {
    expect(ratio(1, 4)).toBe(0.25)
    expect(ratio(-3, 2)).toBe(-1.5)
  })

  it('分母が0なら0', () => {
    expect(ratio(0, 0)).toBe(0)
    expect(ratio(5, 0)).toBe(0)
  })
})
