import { transactionRoutes } from '@/libs/routes/transactionRoutes'
import { expenseConfig } from '@/libs/routes/transactions'
import { getYearMonth } from '@/utils/dateUtils'

/** 入力日付の年月の定期支払いチェック画面（日付が不正なら今月） */
const checkUrl = (date: unknown) => {
  const { year, month } = getYearMonth(typeof date === 'string' ? date : undefined)
  return `/auth/expense_check?year=${year}&month=${month}`
}

export const POST = transactionRoutes({ ...expenseConfig, backUrl: checkUrl }).create
