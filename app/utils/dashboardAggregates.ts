import type { AssetTableItems, ExpenseTableItems } from '@/@types/common'
import type { AssetWithCategory, SummaryItem } from '@/@types/dbTypes'
import { colorSchema } from '@/settings/kakeiboSettings'
import { accumulate, getNextMonth, getNextMonthYear, ratio } from '@/utils/dashboardUtils'

const sumAmount = (items: { amount: number }[]) => items.reduce((s, i) => s + i.amount, 0)
const sumTotal = (items: { total_amount: number }[]) =>
  items.reduce((s, i) => s + i.total_amount, 0)

/** カテゴリID → グラフの色（並び順に colorSchema を割り当てる） */
export const buildColorMap = (categories: { id: number }[]): Record<number, string> =>
  Object.fromEntries(categories.map((category, i) => [category.id, colorSchema[i]]))

/** 資産ダッシュボード: 当月・前月・年初の資産から、カテゴリ別の表と合計の増減を作る */
export const buildAssetSummary = (
  now: AssetWithCategory[],
  prev: AssetWithCategory[],
  annualStart: AssetWithCategory[]
) => {
  const tableItems: AssetTableItems = {}
  const blank = { prevDiff: 0, prevDiffRatio: 0, annualStartDiff: 0, annualStartDiffRatio: 0 }
  for (const elm of now) {
    tableItems[elm.asset_category_id] = {
      categoryName: elm.category_name,
      now: elm.amount,
      ...blank,
    }
  }
  // 前月・年初にしか無いカテゴリは、当月0として減少扱いにする
  for (const elm of prev) {
    const item = tableItems[elm.asset_category_id]
    if (item) {
      item.prevDiff = item.now - elm.amount
      item.prevDiffRatio = ratio(item.prevDiff, elm.amount)
    } else {
      tableItems[elm.asset_category_id] = {
        categoryName: elm.category_name,
        now: 0,
        ...blank,
        prevDiff: -elm.amount,
        prevDiffRatio: -1,
      }
    }
  }
  for (const elm of annualStart) {
    const item = tableItems[elm.asset_category_id]
    if (item) {
      item.annualStartDiff = item.now - elm.amount
      item.annualStartDiffRatio = ratio(item.annualStartDiff, elm.amount)
    } else {
      tableItems[elm.asset_category_id] = {
        categoryName: elm.category_name,
        now: 0,
        ...blank,
        annualStartDiff: -elm.amount,
        annualStartDiffRatio: -1,
      }
    }
  }

  const totalAmount = sumAmount(now)
  const prevTotalAmount = sumAmount(prev)
  const annualTotalAmount = sumAmount(annualStart)
  const prevTotalDiff = totalAmount - prevTotalAmount
  const annualTotalDiff = totalAmount - annualTotalAmount
  return {
    tableItems,
    totalAmount,
    prevTotalDiff,
    prevTotalDiffRatio: ratio(prevTotalDiff, prevTotalAmount),
    annualTotalDiff,
    annualTotalDiffRatio: ratio(annualTotalDiff, annualTotalAmount),
  }
}

/** 月間収支: カテゴリ別の支出（前月比つき）と、収支の合計 */
export const buildMonthlyBalance = (
  categories: { id: number; name: string }[],
  expense: SummaryItem[],
  prevExpense: SummaryItem[],
  income: SummaryItem[]
) => {
  // 支出の無いカテゴリも0で並べる
  const tableItems: ExpenseTableItems = {}
  for (const category of categories) {
    tableItems[category.id] = { categoryName: category.name, now: 0, prevDiff: 0 }
  }
  for (const elm of expense) {
    tableItems[elm.category_id] = {
      ...tableItems[elm.category_id],
      now: elm.total_amount,
      prevDiff: elm.total_amount,
    }
  }
  for (const elm of prevExpense) {
    const item = tableItems[elm.category_id]
    tableItems[elm.category_id] = { ...item, prevDiff: item.now - elm.total_amount }
  }

  const expenseTotal = sumTotal(expense)
  const incomeTotal = sumTotal(income)
  return {
    tableItems,
    expenseTotal,
    incomeTotal,
    balance: incomeTotal - expenseTotal,
    prevTotalDiff: expenseTotal - sumTotal(prevExpense),
  }
}

/**
 * 収支推移: 年月ごとの収入・支出の合計
 * カテゴリIDを指定するとそのカテゴリだけ合計する（年月の軸は全カテゴリから作る）
 */
export const buildBalanceTransition = (
  income: SummaryItem[],
  expense: SummaryItem[],
  incomeCategoryId: string,
  expenseCategoryId: string
) => {
  const months = new Set<string>()
  const monthlyTotal = (rows: SummaryItem[], categoryId: string) => {
    const totals: Record<string, number> = {}
    for (const row of rows) {
      months.add(row.year_month)
      totals[row.year_month] ??= 0
      if (!categoryId || String(row.category_id) === categoryId) {
        totals[row.year_month] += row.total_amount
      }
    }
    return totals
  }
  const incomeTotals = monthlyTotal(income, incomeCategoryId)
  const expenseTotals = monthlyTotal(expense, expenseCategoryId)

  const labels = [...months].sort((a, b) => a.localeCompare(b))
  return {
    labels,
    incomeAmounts: labels.map((m) => incomeTotals[m] ?? 0),
    expenseAmounts: labels.map((m) => expenseTotals[m] ?? 0),
  }
}

/**
 * 投資サマリ: 投資用資産の保有価額と、累積の入金額
 * 入金はその翌月の資産に反映されるので、入金額は翌月に計上する
 */
export const buildInvestmentSummary = (holdings: SummaryItem[], deposits: SummaryItem[]) => {
  const holdingTotals: Record<string, number> = {}
  for (const elm of holdings) {
    holdingTotals[elm.year_month] = (holdingTotals[elm.year_month] ?? 0) + elm.total_amount
  }
  const depositTotals: Record<string, number> = {}
  for (const elm of deposits) {
    const [year, month] = elm.year_month.split('-').map(Number)
    const next = `${getNextMonthYear(year, month)}-${String(getNextMonth(month)).padStart(2, '0')}`
    depositTotals[next] = (depositTotals[next] ?? 0) + elm.total_amount
  }

  const labels = Object.keys(holdingTotals).sort((a, b) => a.localeCompare(b))
  const holdingValues = labels.map((m) => holdingTotals[m])
  const investmentAmounts = accumulate(labels.map((m) => depositTotals[m] ?? 0))
  const latestHoldingValue = holdingValues.at(-1) ?? 0
  const latestInvestmentAmount = investmentAmounts.at(-1) ?? 0
  const profit = latestHoldingValue - latestInvestmentAmount
  return {
    labels,
    holdingValues,
    investmentAmounts,
    latestHoldingValue,
    latestInvestmentAmount,
    profit,
    profitRate: ratio(profit, latestInvestmentAmount) * 100,
  }
}
