import { masterRoutes } from '@/libs/routes/masterRoutes'

export const expenseCategoryRoutes = masterRoutes({
  table: 'expense_category',
  label: '支出カテゴリ',
})
export const incomeCategoryRoutes = masterRoutes({
  table: 'income_category',
  label: '収入カテゴリ',
})
export const assetCategoryRoutes = masterRoutes({
  table: 'asset_category',
  label: '資産カテゴリ',
  investmentFlag: true,
})
export const paymentMethodRoutes = masterRoutes({ table: 'payment_method', label: '支払方法' })
