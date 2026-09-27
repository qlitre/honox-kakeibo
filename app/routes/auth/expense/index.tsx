import type { TableHeaderItem } from '@/@types/common'
import { createRoute } from 'honox/factory'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { getFlash } from '@/libs/flash'
import { FlashAlerts } from '@/components/FlashAlerts'
import { TransactionFormModal, type SelectField } from '@/islands/TransactionFormModal'
import { toFormValues, toOptions } from '@/components/transactionForms'
import { TransactionDeleteModal } from '@/islands/TransactionDeleteModal'
import { ExpenseSearchForm } from '@/islands/expense/ExpenseSearchForm'
import { Table } from '@/components/share/Table'
import { kakeiboPerPage } from '@/settings/kakeiboSettings'
import { getBeginningOfMonth, getEndOfMonth } from '@/utils/dashboardUtils'
import { getQueryString } from '@/utils/getQueryString'
import { fetchListWithFilter, fetchSimpleList } from '@/libs/dbService'
import type { Filter } from '@/utils/sqlUtils'
import { getTodayDate } from '@/utils/dateUtils'

export default createRoute(async (c) => {
  const db = c.env.DB
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = kakeiboPerPage
  const offset = limit * (page - 1)
  const month = c.req.query('month')
  const categoryId = c.req.query('categoryId')
  const paymentMethodId = c.req.query('paymentMethodId')
  const keyword = c.req.query('keyword')
  const filters: Filter<'expense'>[] = []
  if (month) {
    const year = Number(month.slice(0, 4))
    const _month = Number(month.slice(5, 7))
    filters.push(
      { field: 'date', op: 'gte', value: getBeginningOfMonth(year, _month) },
      { field: 'date', op: 'lte', value: getEndOfMonth(year, _month) }
    )
  }
  if (categoryId) filters.push({ field: 'expense_category_id', op: 'eq', value: categoryId })
  if (paymentMethodId)
    filters.push({ field: 'payment_method_id', op: 'eq', value: paymentMethodId })
  if (keyword) filters.push({ field: 'description', op: 'contains', value: keyword })

  const query = c.req.query()
  const baseUrl = new URL(c.req.url).origin
  const queryString = getQueryString(c.req.url, baseUrl)

  // 支出一覧の取得
  const expenses = await fetchListWithFilter({
    db,
    table: 'expense',
    filters,
    orders: '-date,expense_category_id',
    limit,
    offset,
  })

  // カテゴリ・支払い方法
  const categories = await fetchSimpleList({
    db,
    table: 'expense_category',
    orders: 'updated_at',
  })

  const paymentMethods = await fetchSimpleList({
    db,
    table: 'payment_method',
    orders: 'updated_at',
  })

  const flash = getFlash(c)
  const selects: SelectField[] = [
    { name: 'expense_category_id', label: 'カテゴリ', options: toOptions(categories.contents) },
    { name: 'payment_method_id', label: '支払い方法', options: toOptions(paymentMethods.contents) },
  ]

  const headers: TableHeaderItem[] = [
    { name: '日付', textPosition: 'left' },
    { name: 'カテゴリ', textPosition: 'left' },
    { name: '金額', textPosition: 'right' },
    { name: '支払い方法', textPosition: 'left' },
    { name: '説明', textPosition: 'center' },
    { name: '操作', textPosition: 'center' },
  ]

  const lastUpdate = c.req.query('lastUpdate') ?? '0'
  const lastUpdateId = parseInt(lastUpdate)

  return c.render(
    <>
      <div className='px-4 sm:px-6 lg:px-8'>
        <FlashAlerts {...flash} />
        <div className='flex items-center justify-between'>
          <PageHeader title='支出リスト' />
          <TransactionFormModal
            buttonType='primary'
            buttonTitle='支出追加'
            title='作成'
            actionUrl='/auth/expense/create'
            selects={selects}
          />
        </div>
        <ExpenseSearchForm
          data={{
            month,
            category_id: categoryId,
            payment_method_id: paymentMethodId,
            keyword,
          }}
          categories={categories}
          paymentMethods={paymentMethods}
        />
        <Table headers={headers}>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {expenses.contents.map((expense) => (
              <tr
                key={expense.id}
                className={expense.id === lastUpdateId ? 'bg-green-100' : 'hover:bg-gray-50'}
              >
                <td className='whitespace-nowrap py-4 pl-6 text-sm text-gray-900'>
                  {expense.date}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                  {expense.category_name}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right'>
                  {expense.amount.toLocaleString()} 円
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                  {expense.payment_method_name}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center'>
                  {expense.description || '-'}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center'>
                  <TransactionFormModal
                    buttonType='success'
                    buttonTitle='編集'
                    values={toFormValues(expense, selects)}
                    title='編集'
                    actionUrl={`/auth/expense/${expense.id}/update?${queryString}`}
                    selects={selects}
                  />
                  <TransactionFormModal
                    buttonType='primary'
                    buttonTitle='複写'
                    values={{ ...toFormValues(expense, selects), date: getTodayDate() }}
                    title='複写'
                    actionUrl='/auth/expense/create'
                    selects={selects}
                  />
                  <TransactionDeleteModal
                    title='支出削除'
                    actionUrl={`/auth/expense/${expense.id}/delete?${queryString}`}
                    details={[
                      { label: '詳細', value: expense.description || '説明なし' },
                      { label: 'カテゴリ', value: expense.category_name },
                      { label: '支払い方法', value: expense.payment_method_name },
                    ]}
                    amount={expense.amount}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          pageSize={expenses.pageSize}
          currentPage={page}
          hrefPrefix='/auth/expense'
          query={query}
        />
      </div>
    </>,
    { title: '支出リスト' }
  )
})
