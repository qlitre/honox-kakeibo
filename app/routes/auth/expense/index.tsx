import type { TableHeaderItem } from '@/@types/common'
import type { ExpenseCategoryResponse, ExpenseWithDetailsResponse, PaymentMethodResponse } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { AlertSuccess } from '@/islands/share/AlertSuccess'
import { getCookie } from 'hono/cookie'
import { alertCookieKey } from '@/settings/kakeiboSettings'
import { ExpenseDeleteModal } from '@/islands/expense/ExpenseDeleteModal'
import { ExpenseCreateModal } from '@/islands/expense/ExpenseCreateModal'
import { Table } from '@/components/share/Table'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = 10
    const offset = limit * (p - 1)
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const expenses = await client.getListResponse<ExpenseWithDetailsResponse>({
        endpoint: 'expense', queries: {
            orders: '-date,expense_category_id',
            limit: limit,
            offset: offset
        }
    })
    const categories = await client.getListResponse<ExpenseCategoryResponse>({
        endpoint: 'expense_category', queries: {
            limit: 100
        }
    })
    const paymentMethods = await client.getListResponse<PaymentMethodResponse>({
        endpoint: 'payment_method', queries: {
            limit: 100
        }
    })
    const pageSize = expenses.pageSize
    const query = c.req.query()
    const message = getCookie(c, alertCookieKey)

    const headers: TableHeaderItem[] = [
        { name: '日付', textPosition: 'left' },
        { name: 'カテゴリ', textPosition: 'left' },
        { name: '金額', textPosition: 'right' },
        { name: '支払い方法', textPosition: 'left' },
        { name: '説明', textPosition: 'center' },
        { name: '操作', textPosition: 'center' }
    ]

    return c.render(
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                {message && <AlertSuccess message={message}></AlertSuccess>}
                <div className="flex items-center justify-between">
                    <PageHeader title="支出リスト" />
                    <ExpenseCreateModal
                        buttonType='primary'
                        buttonTitle='支出追加'
                        title='作成'
                        actionUrl='/auth/expense/create'
                        categories={categories}
                        payment_methods={paymentMethods}
                    />

                </div>
                <Table headers={headers}>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {expenses.contents.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                                    {expense.date}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {expense.category_name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                                    {expense.amount.toLocaleString()} 円
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {expense.payment_method_name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                    {expense.description || '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                                    <ExpenseCreateModal
                                        buttonType='success'
                                        buttonTitle='編集'
                                        data={{
                                            date: expense.date,
                                            amount: String(expense.amount),
                                            expense_category_id: String(expense.expense_category_id),
                                            payment_method_id: String(expense.payment_method_id),
                                            description: expense.description || ''
                                        }}
                                        title='編集'
                                        actionUrl={`/auth/expense/${expense.id}/update`}
                                        categories={categories}
                                        payment_methods={paymentMethods}>
                                    </ExpenseCreateModal>
                                    <ExpenseCreateModal
                                        buttonType='primary'
                                        buttonTitle='複写'
                                        data={{
                                            date: expense.date,
                                            amount: String(expense.amount),
                                            expense_category_id: String(expense.expense_category_id),
                                            payment_method_id: String(expense.payment_method_id),
                                            description: expense.description || ''
                                        }}
                                        title='複写'
                                        actionUrl='/auth/expense/create'
                                        categories={categories}
                                        payment_methods={paymentMethods}>
                                    </ExpenseCreateModal>
                                    <ExpenseDeleteModal actionUrl={`/auth/expense/${expense.id}/delete`} expense={expense} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/expense" query={query} />
            </div >
        </>, { title: '支出リスト' }
    );
})
