import { createRoute } from 'honox/factory'
import { ExpenseCategoryResponse, ExpenseWithDetailsResPonse, PaymentMethodResponse } from '@/@types/dbTypes'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { AlertSuccess } from '@/islands/AlertSuccess'
import { getCookie } from 'hono/cookie'
import { alertCookieKey } from '@/settings/kakeiboSettings'
import { CreateModal } from '@/islands/common/CreateModal'
import { ExpenseCreateForm } from '@/islands/expense/ExpenseCreateForm'
import { DeleteModal } from '@/islands/common/DeleteModal'
import { ExpenseDeleteConfirm } from '@/islands/expense/ExpenseDeleteConfirm'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = 10
    const offset = limit * (p - 1)
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const assets = await client.getListResponse<ExpenseWithDetailsResPonse>({
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
    const pageSize = assets.pageSize
    const query = c.req.query()
    const message = getCookie(c, alertCookieKey)

    return c.render(
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                {message && <AlertSuccess message={message}></AlertSuccess>}
                <div className="flex items-center justify-between">
                    <PageHeader title="支出リスト" />
                    <CreateModal buttonType='primary' title='支出追加'>
                        <ExpenseCreateForm
                            title='支出追加'
                            actionUrl='/auth/expense/create'
                            categories={categories}
                            payment_methods={paymentMethods} />
                    </CreateModal>
                </div>
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden border border-gray-300 rounded-lg shadow ring-1 ring-black ring-opacity-5">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="py-4 pl-6 text-left text-sm font-semibold text-gray-900">
                                                日付
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                カテゴリ
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                支払い方法
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                金額
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                                説明
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                                操作
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {assets.contents.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                                                    {expense.date}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {expense.category_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {expense.payment_method_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                                                    {expense.amount.toLocaleString()} 円
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                                                    <CreateModal buttonType='success' title='編集'>
                                                        <ExpenseCreateForm
                                                            data={{
                                                                date: expense.date,
                                                                amount: String(expense.amount),
                                                                expense_category_id: String(expense.expense_category_id),
                                                                payment_method_id: String(expense.payment_method_id),
                                                                description: expense.description || ''
                                                            }}
                                                            title='支出編集'
                                                            actionUrl={`/auth/expense/${expense.id}/update`}
                                                            categories={categories}
                                                            payment_methods={paymentMethods}
                                                        ></ExpenseCreateForm>
                                                    </CreateModal>
                                                    <DeleteModal title='支出削除' actionUrl={`/auth/expense/${expense.id}/delete`}>
                                                        <ExpenseDeleteConfirm expense={expense} />
                                                    </DeleteModal>

                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/expense" query={query} />
            </div >
        </>, { title: '支出リスト' }
    );
})
