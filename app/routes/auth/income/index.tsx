// app/routes/auth/income/index.tsx
import type { TableHeaderItem } from '@/@types/common'
import { createRoute } from 'honox/factory'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { TransactionFormModal, type SelectField } from '@/islands/TransactionFormModal'
import { TransactionDeleteModal } from '@/islands/TransactionDeleteModal'
import { toFormValues, toOptions } from '@/components/transactionForms'
import { Table } from '@/components/share/Table'
import { getFlash } from '@/libs/flash'
import { FlashAlerts } from '@/components/FlashAlerts'
import { getQueryString } from '@/utils/getQueryString'
import { fetchListWithFilter, fetchSimpleList } from '@/libs/dbService'
import { kakeiboPerPage } from '@/settings/kakeiboSettings'
import { getTodayDate } from '@/utils/dateUtils'

export default createRoute(async (c) => {
  const db = c.env.DB
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = kakeiboPerPage
  const offset = limit * (page - 1)

  const query = c.req.query()
  const baseUrl = new URL(c.req.url).origin
  const queryString = getQueryString(c.req.url, baseUrl)

  // 収入一覧取得
  const incomes = await fetchListWithFilter({
    db,
    table: 'income',
    orders: '-date,income_category_id',
    limit,
    offset,
  })

  // カテゴリ一覧取得
  const categories = await fetchSimpleList({
    db,
    table: 'income_category',
    orders: 'updated_at',
  })

  const flash = getFlash(c)
  const selects: SelectField[] = [
    { name: 'income_category_id', label: 'カテゴリ', options: toOptions(categories.contents) },
  ]
  const headers: TableHeaderItem[] = [
    { name: '日付', textPosition: 'left' },
    { name: 'カテゴリ', textPosition: 'left' },
    { name: '金額', textPosition: 'right' },
    { name: '説明', textPosition: 'center' },
    { name: '操作', textPosition: 'center' },
  ]
  const lastUpdateId = parseInt(c.req.query('lastUpdate') ?? '0')

  return c.render(
    <>
      <div className='px-4 sm:px-6 lg:px-8'>
        <FlashAlerts {...flash} />
        <div className='flex items-center justify-between'>
          <PageHeader title='収入リスト' />
          <TransactionFormModal
            buttonType='primary'
            buttonTitle='収入追加'
            title='作成'
            actionUrl='/auth/income/create'
            selects={selects}
          />
        </div>
        <Table headers={headers}>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {incomes.contents.map((income) => (
              <tr
                key={income.id}
                className={income.id === lastUpdateId ? 'bg-green-100' : 'hover:bg-gray-50'}
              >
                <td className='whitespace-nowrap py-4 pl-6 text-sm text-gray-900'>{income.date}</td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                  {income.category_name}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right'>
                  {income.amount.toLocaleString()} 円
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center'>
                  {income.description || '-'}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center'>
                  <TransactionFormModal
                    buttonType='success'
                    buttonTitle='編集'
                    values={toFormValues(income, selects)}
                    title='収入編集'
                    actionUrl={`/auth/income/${income.id}/update?${queryString}`}
                    selects={selects}
                  />
                  <TransactionFormModal
                    buttonType='primary'
                    buttonTitle='複写'
                    values={{ ...toFormValues(income, selects), date: getTodayDate() }}
                    title='複写'
                    actionUrl='/auth/income/create'
                    selects={selects}
                  />
                  <TransactionDeleteModal
                    title='収入削除'
                    actionUrl={`/auth/income/${income.id}/delete?${queryString}`}
                    details={[
                      { label: '詳細', value: income.description || '説明なし' },
                      { label: 'カテゴリ', value: income.category_name },
                    ]}
                    amount={income.amount}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          pageSize={incomes.pageSize}
          currentPage={page}
          hrefPrefix='/auth/income'
          query={query}
        />
      </div>
    </>,
    { title: '収入リスト' }
  )
})
