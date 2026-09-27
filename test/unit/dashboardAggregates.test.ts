import { describe, expect, it } from 'vitest'
import type { AssetWithCategory, SummaryItem } from '@/@types/dbTypes'
import { colorSchema } from '@/settings/kakeiboSettings'
import {
  buildAssetSummary,
  buildBalanceTransition,
  buildColorMap,
  buildInvestmentSummary,
  buildMonthlyBalance,
} from '@/utils/dashboardAggregates'

const asset = (asset_category_id: number, category_name: string, amount: number) =>
  ({ asset_category_id, category_name, amount }) as AssetWithCategory

const summary = (year_month: string, total_amount: number, category_id = 0): SummaryItem => ({
  year_month,
  total_amount,
  category_id,
  category_name: '',
})

describe('buildColorMap', () => {
  it('並び順に色を割り当てる', () => {
    expect(buildColorMap([{ id: 5 }, { id: 2 }])).toEqual({ 5: colorSchema[0], 2: colorSchema[1] })
  })
})

describe('buildAssetSummary', () => {
  it('カテゴリ別の当月・前月比・年初比と、合計の増減', () => {
    const r = buildAssetSummary(
      [asset(1, '預金', 1200), asset(2, '証券', 300)],
      [asset(1, '預金', 1000)],
      [asset(1, '預金', 600)]
    )
    expect(r.tableItems[1]).toEqual({
      categoryName: '預金',
      now: 1200,
      prevDiff: 200,
      prevDiffRatio: 0.2,
      annualStartDiff: 600,
      annualStartDiffRatio: 1,
    })
    // 前月・年初に無いカテゴリは増減0
    expect(r.tableItems[2]).toMatchObject({ now: 300, prevDiff: 0, annualStartDiff: 0 })
    expect(r).toMatchObject({
      totalAmount: 1500,
      prevTotalDiff: 500,
      prevTotalDiffRatio: 0.5,
      annualTotalDiff: 900,
      annualTotalDiffRatio: 1.5,
    })
  })

  it('当月に無いカテゴリは当月0の減少として並べる', () => {
    const r = buildAssetSummary([], [asset(1, '預金', 100)], [asset(2, '証券', 50)])
    expect(r.tableItems[1]).toMatchObject({ now: 0, prevDiff: -100, prevDiffRatio: -1 })
    expect(r.tableItems[2]).toMatchObject({
      now: 0,
      annualStartDiff: -50,
      annualStartDiffRatio: -1,
    })
  })

  it('前月・年初が0件なら比率は0', () => {
    const r = buildAssetSummary([asset(1, '預金', 100)], [], [])
    expect(r).toMatchObject({ prevTotalDiffRatio: 0, annualTotalDiffRatio: 0 })
  })
})

describe('buildMonthlyBalance', () => {
  const categories = [
    { id: 1, name: '食費' },
    { id: 2, name: '家賃' },
    { id: 3, name: '雑費' },
  ]

  it('全カテゴリを並べ、当月と前月比、収支を出す', () => {
    const r = buildMonthlyBalance(
      categories,
      [summary('2026-09', 300, 1), summary('2026-09', 800, 2)],
      [summary('2026-08', 500, 1)],
      [summary('2026-09', 2000, 9)]
    )
    expect(r.tableItems).toEqual({
      1: { categoryName: '食費', now: 300, prevDiff: -200 },
      2: { categoryName: '家賃', now: 800, prevDiff: 800 },
      3: { categoryName: '雑費', now: 0, prevDiff: 0 },
    })
    expect(r).toMatchObject({
      expenseTotal: 1100,
      incomeTotal: 2000,
      balance: 900,
      prevTotalDiff: 600,
    })
  })
})

describe('buildBalanceTransition', () => {
  const income = [summary('2026-08', 100, 1), summary('2026-09', 200, 2)]
  const expense = [summary('2026-09', 50, 3), summary('2026-07', 30, 4)]

  it('年月順に収入・支出の合計を並べる', () => {
    expect(buildBalanceTransition(income, expense, '', '')).toEqual({
      labels: ['2026-07', '2026-08', '2026-09'],
      incomeAmounts: [0, 100, 200],
      expenseAmounts: [30, 0, 50],
    })
  })

  it('カテゴリを指定するとそのカテゴリだけ合計する（年月の軸は変えない）', () => {
    expect(buildBalanceTransition(income, expense, '2', '4')).toEqual({
      labels: ['2026-07', '2026-08', '2026-09'],
      incomeAmounts: [0, 0, 200],
      expenseAmounts: [30, 0, 0],
    })
  })
})

describe('buildInvestmentSummary', () => {
  it('入金は翌月に計上して累積し、最新月の利益・利益率を出す', () => {
    const r = buildInvestmentSummary(
      [summary('2026-08', 10500), summary('2026-09', 16000), summary('2026-09', 500)],
      [summary('2026-07', 10000), summary('2026-08', 5000)]
    )
    expect(r).toEqual({
      labels: ['2026-08', '2026-09'],
      holdingValues: [10500, 16500],
      investmentAmounts: [10000, 15000],
      latestHoldingValue: 16500,
      latestInvestmentAmount: 15000,
      profit: 1500,
      profitRate: 10,
    })
  })

  it('12月の入金は翌年1月に計上する', () => {
    const r = buildInvestmentSummary([summary('2027-01', 100)], [summary('2026-12', 80)])
    expect(r.investmentAmounts).toEqual([80])
  })

  it('データが無ければ0', () => {
    expect(buildInvestmentSummary([], [])).toMatchObject({ labels: [], profit: 0, profitRate: 0 })
  })
})
