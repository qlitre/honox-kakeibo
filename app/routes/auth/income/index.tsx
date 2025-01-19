import type { TableHeaderItem } from '@/@types/common'
import type { IncomeCategoryResponse, IncomeWithCategoryResponse } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Alert } from '@/islands/share/Alert'
import { getCookie } from 'hono/cookie'
import { successAlertCookieKey } from '@/settings/kakeiboSettings'
import { IncomeDeleteModal } from '@/islands/income/IncomeDeleteModal'
import { IncomeCreateModal } from '@/islands/income/IncomeCreateModal'
import { Table } from '@/components/share/Table'
import { kakeiboPerPage } from '@/settings/kakeiboSettings'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = kakeiboPerPage
    const offset = limit * (p - 1)
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const incomes = await client.getListResponse<IncomeWithCategoryResponse>({
        endpoint: 'income', queries: {
            orders: '-date,income_category_id',
            limit: limit,
            offset: offset
        }
    })
    const categories = await client.getListResponse<IncomeCategoryResponse>({
        endpoint: 'income_category', queries: {
            limit: 100
        }
    })
    const pageSize = incomes.pageSize
    const query = c.req.query()
    const successMessage = getCookie(c, successAlertCookieKey)
    const headers: TableHeaderItem[] = [
        { name: '日付', textPosition: 'left' },
        { name: 'カテゴリ', textPosition: 'left' },
        { name: '金額', textPosition: 'right' },
        { name: '説明', textPosition: 'center' },
        { name: '操作', textPosition: 'center' }
    ]
    return c.render(
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                {successMessage && <Alert message={successMessage} type='success'></Alert>}
                <div className="flex items-center justify-between">
                    <PageHeader title="収入リスト" />
                    <IncomeCreateModal
                        buttonType='primary'
                        buttonTitle='収入追加'
                        title='作成'
                        actionUrl='/auth/income/create'
                        categories={categories}
                    />
                </div>
                <Table headers={headers}>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {incomes.contents.map((income) => (
                            <tr key={income.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                                    {income.date}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {income.category_name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                                    {income.amount.toLocaleString()} 円
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                    {income.description || '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                                    <IncomeCreateModal
                                        buttonType='success'
                                        buttonTitle='編集'
                                        data={{
                                            date: income.date,
                                            amount: String(income.amount),
                                            income_category_id: String(income.income_category_id),
                                            description: income.description || ''
                                        }}
                                        title='収入編集'
                                        actionUrl={`/auth/income/${income.id}/update?redirectPage=${page}`}
                                        categories={categories}
                                    >
                                    </IncomeCreateModal>
                                    <IncomeCreateModal
                                        buttonType='primary'
                                        buttonTitle='複写'
                                        data={{
                                            date: income.date,
                                            amount: String(income.amount),
                                            income_category_id: String(income.income_category_id),
                                            description: income.description || ''
                                        }}
                                        title='複写'
                                        actionUrl='/auth/income/create'
                                        categories={categories}
                                    >
                                    </IncomeCreateModal>
                                    <IncomeDeleteModal actionUrl={`/auth/income/${income.id}/delete`} income={income} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/income" query={query} />
            </div >
        </>, { title: '収入リスト' }
    );
})
