import { createRoute } from 'honox/factory'
import { BalanceTransitionChart } from '@/components/chart/BalanceTransitionChart'
import { Card } from '@/components/share/Card'
import { BalanceTransitionForm } from '@/islands/BalanceTransitionForm'
import { fetchSummary, fetchSimpleList } from '@/libs/dbService'
import { buildBalanceTransition } from '@/utils/dashboardAggregates'

export default createRoute(async (c) => {
  const db = c.env.DB

  /* ---------- クエリパラメータ ---------- */
  const incomeCategoryId = c.req.query('income_category') ?? ''
  const expenseCategoryId = c.req.query('expense_category') ?? ''

  const [income, expense, incomeCats, expenseCats] = await Promise.all([
    fetchSummary({ db, table: 'income', groupBy: ['year_month', 'category_name'] }),
    fetchSummary({ db, table: 'expense', groupBy: ['year_month', 'category_name'] }),
    fetchSimpleList({ db, table: 'income_category', orders: 'updated_at' }),
    fetchSimpleList({ db, table: 'expense_category', orders: 'updated_at' }),
  ])
  const { labels, incomeAmounts, expenseAmounts } = buildBalanceTransition(
    income.summary,
    expense.summary,
    incomeCategoryId,
    expenseCategoryId
  )

  /* ---------- レンダリング ---------- */
  return c.render(
    <>
      <BalanceTransitionForm
        incomeDefaultValue={incomeCategoryId}
        incomeCategories={incomeCats.contents}
        expenseDefaultValue={expenseCategoryId}
        expenseCategories={expenseCats.contents}
      />
      <Card>
        <BalanceTransitionChart
          labels={labels}
          incomeAmounts={incomeAmounts}
          expenseAmounts={expenseAmounts}
        />
      </Card>
    </>
  )
})
