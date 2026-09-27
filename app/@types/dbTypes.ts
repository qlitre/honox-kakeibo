import type { Row, TableName } from '@/utils/sqlSchema'

export type KakeiboListResponse<T> = {
  contents: T[]
  totalCount: number
  limit: number
  offset: number
  pageSize: number
}

/** 各テーブルを fetch したときの行の型（テーブル定義 sqlSchema から導く） */
export type RowOf = { [N in TableName]: Row<N> }

export type AssetCategory = Row<'asset_category'>
export type AssetWithCategory = Row<'asset'>
export type FundTransaction = Row<'fund_transaction'>
export type ExpenseCategory = Row<'expense_category'>
export type PaymentMethod = Row<'payment_method'>
export type Expense = Row<'expense'>
export type IncomeCategory = Row<'income_category'>
export type IncomeWithCategory = Row<'income'>
export type ExpenseCheckTemplate = Row<'expense_check_template'>

// 各サマリーデータの型定義
export type SummaryItem = {
  year_month: string
  total_amount: number
  category_name: string
  category_id: number
}

export type AssetCategoryResponse = KakeiboListResponse<AssetCategory>
export type ExpenseCategoryResponse = KakeiboListResponse<ExpenseCategory>
export type PaymentMethodResponse = KakeiboListResponse<PaymentMethod>
export type IncomeCategoryResponse = KakeiboListResponse<IncomeCategory>
