import { z } from 'zod'
import { checkAssetCategoryDuplication } from '@/utils/assetValidation'
import { transactionRoutes, type TransactionConfig } from '@/libs/routes/transactionRoutes'

// フォームは文字列で届くので、数値は数字だけの文字列として受けて変換する
const date = z.string().length(10)
const id = z.string().regex(/^\d+$/)
const amount = z.string().regex(/^\d+$/)
const description = z.string()

const expenseForm = z.object({
  date,
  amount,
  expense_category_id: id,
  payment_method_id: id,
  description,
})

/** 定期支払いチェックからの支出追加でも使う */
export const expenseConfig = {
  table: 'expense',
  label: '支出',
  form: expenseForm,
  toData: (f: z.output<typeof expenseForm>) => ({
    date: f.date,
    amount: Number(f.amount),
    expense_category_id: Number(f.expense_category_id),
    payment_method_id: Number(f.payment_method_id),
    description: f.description,
  }),
  slackDetails: (item) => [
    `カテゴリ: ${item.category_name}`,
    `支払い方法: ${item.payment_method_name}`,
  ],
} satisfies TransactionConfig<'expense', typeof expenseForm, Record<string, unknown>>

export const expenseRoutes = transactionRoutes(expenseConfig)

export const incomeRoutes = transactionRoutes({
  table: 'income',
  label: '収入',
  form: z.object({ date, amount, income_category_id: id, description }),
  toData: (f) => ({
    date: f.date,
    amount: Number(f.amount),
    income_category_id: Number(f.income_category_id),
    description: f.description,
  }),
  slackDetails: (item) => [`カテゴリ: ${item.category_name}`],
})

export const assetRoutes = transactionRoutes({
  table: 'asset',
  label: '資産',
  form: z.object({ date, amount, asset_category_id: id, description }),
  toData: (f) => ({
    date: f.date,
    amount: Number(f.amount),
    asset_category_id: Number(f.asset_category_id),
    description: f.description,
  }),
  slackDetails: (item) => [`カテゴリ: ${item.category_name}`],
  check: async (db, data, excludeId) => {
    const duplicated = await checkAssetCategoryDuplication({
      db,
      date: data.date,
      assetCategoryId: data.asset_category_id,
      excludeId,
    })
    return duplicated ? '同月に同カテゴリの資産が登録されています。' : undefined
  },
})

export const fundTransactionRoutes = transactionRoutes({
  table: 'fund_transaction',
  label: '投資用口座入金履歴',
  form: z.object({ date, amount, description }),
  toData: (f) => ({ date: f.date, amount: Number(f.amount), description: f.description }),
  slackDetails: () => [],
})
