import type { TableHeaderItem } from '@/@types/common'
import { createRoute } from 'honox/factory'
import { fetchSummary, fetchSimpleList } from '@/libs/dbService'
import { formatDiff, getPrevMonthYear, getPrevMonth, ratio } from '@/utils/dashboardUtils'
import { buildColorMap, buildMonthlyBalance } from '@/utils/dashboardAggregates'
import { PageHeader } from '@/components/PageHeader'
import { MonthPager } from '@/components/MonthPager'
import { Card } from '@/components/share/Card'
import { CardWithHeading } from '@/components/share/CardWithHeading'
import { Table } from '@/components/share/Table'
import { ExpensePieChart } from '@/components/chart/ExpensePieChart'

const toYearMonth = (year: number, month: number) => `${year}-${month.toString().padStart(2, '0')}`

export default createRoute(async (c) => {
  const db = c.env.DB
  const year = parseInt(c.req.param('year')!)
  const month = parseInt(c.req.param('month')!)
  const yearMonth = toYearMonth(year, month)
  const prevYearMonth = toYearMonth(getPrevMonthYear(year, month), getPrevMonth(month))

  const summaryOf = async (table: 'expense' | 'income', ym: string) => {
    const { summary } = await fetchSummary({
      db,
      table,
      filters: [{ field: 'year_month', op: 'eq', value: ym }],
      groupBy: ['year_month', 'category_name'],
    })
    return summary
  }

  const [expenses, prevExpenses, incomes, categories] = await Promise.all([
    summaryOf('expense', yearMonth),
    summaryOf('expense', prevYearMonth),
    summaryOf('income', yearMonth),
    fetchSimpleList({ db, table: 'expense_category' }),
  ])

  const { tableItems, expenseTotal, incomeTotal, balance, prevTotalDiff } = buildMonthlyBalance(
    categories.contents,
    expenses,
    prevExpenses,
    incomes
  )
  const prevTotalDiffSign = formatDiff(prevTotalDiff).sign
  const prevTotalDiffColor = formatDiff(-1 * prevTotalDiff).color
  const colormap = buildColorMap(categories.contents)
  const diff = formatDiff(balance)
  const hearders: TableHeaderItem[] = [
    { name: 'カテゴリ', textPosition: 'left' },
    { name: '金額', textPosition: 'right' },
    { name: '前月比', textPosition: 'right' },
    { name: '割合', textPosition: 'right' },
  ]
  return c.render(
    <div>
      <PageHeader title='月間収支'></PageHeader>
      <MonthPager year={year} month={month} hrefSuffix='monthly_balance'></MonthPager>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4'>
        <CardWithHeading heading='収支'>
          <span className={diff.color}>
            {diff.sign}
            {Math.abs(balance).toLocaleString()}
          </span>
        </CardWithHeading>
        <CardWithHeading heading='支出合計'>{expenseTotal.toLocaleString()}</CardWithHeading>
        <CardWithHeading heading='収入合計'>{incomeTotal.toLocaleString()}</CardWithHeading>
      </div>
      <div className='grid lg:grid-cols-3 gap-4'>
        <Card className='lg:col-span-2'>
          <Table headers={hearders}>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {Object.values(tableItems).map((item, index) => {
                const prevDiffSign = formatDiff(item.prevDiff).sign
                // プラスの時に赤にさせたいため
                const prevDiffColor = formatDiff(-1 * item.prevDiff).color
                return (
                  <tr key={index} className='border-t'>
                    <td className='px-4 py-4 text-left'>{item.categoryName}</td>
                    <td className='px-4 py-4 text-right'>{item.now.toLocaleString()}</td>
                    <td className={`px-4 py-4 ${prevDiffColor} text-right`}>
                      {prevDiffSign}
                      {Math.abs(item.prevDiff).toLocaleString()}
                    </td>
                    <td className='px-4 py-4 text-right'>
                      {(ratio(item.now, expenseTotal) * 100).toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
              <tfoot className='bg-gray-100'>
                <tr className='font-semibold'>
                  <td className='px-4 py-4 text-left'>合計</td>
                  <td className='px-4 py-4 text-right'>{expenseTotal.toLocaleString()}</td>
                  <td className={`px-4 py-4 ${prevTotalDiffColor} text-right`}>
                    {prevTotalDiffSign}
                    {Math.abs(prevTotalDiff).toLocaleString()}
                  </td>
                  <td className='px-4 py-4 text-right'>100.00%</td>
                </tr>
              </tfoot>
            </tbody>
          </Table>
        </Card>
        <Card className='w-full'>
          <ExpensePieChart items={expenses} colorMap={colormap} />
        </Card>
      </div>
    </div>,
    { title: '月間収支' }
  )
})
