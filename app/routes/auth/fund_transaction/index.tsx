import type { TableHeaderItem } from '@/@types/common'
import type { FundTransationResponse } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Alert } from '@/islands/share/Alert'
import { getCookie } from 'hono/cookie'
import { successAlertCookieKey } from '@/settings/kakeiboSettings'
import { FundTransactionCreateModal } from '@/islands/fund_transation/FundTransactionCreateModal'
import { FundTransactionDeleteModal } from '@/islands/fund_transation/FundTransactionDeleteModal'
import { Table } from '@/components/share/Table'
import { getQueryString } from '@/utils/getQueryString'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = 10
    const offset = limit * (p - 1)
    const baseUrl = c.env.BASE_URL
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: baseUrl })
    const fundTransactions = await client.getListResponse<FundTransationResponse>({
        endpoint: 'fund_transaction', queries: {
            orders: '-date',
            limit: limit,
            offset: offset
        }
    })
    const pageSize = fundTransactions.pageSize
    const query = c.req.query()
    const successMessage = getCookie(c, successAlertCookieKey)
    const headers: TableHeaderItem[] = [
        { name: '日付', textPosition: 'left' },
        { name: '金額', textPosition: 'right' },
        { name: '説明', textPosition: 'center' },
        { name: '操作', textPosition: 'center' }
    ]
    const lastUpdate = c.req.query('lastUpdate') ?? '0'
    const lastUpdateId = parseInt(lastUpdate)
    const queryString = getQueryString(c.req.url, baseUrl)
    return c.render(
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                {successMessage && <Alert message={successMessage} type='success'></Alert>}
                <div className="flex items-center justify-between">
                    <PageHeader title="投資用口座入金履歴" />
                    <FundTransactionCreateModal
                        buttonType='primary'
                        buttonTitle='履歴追加'
                        title='作成'
                        actionUrl='/auth/fund_transaction/create'
                    />

                </div>
                <Table headers={headers}>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {fundTransactions.contents.map((fund_transaction) => (
                            <tr key={fund_transaction.id} className={`${fund_transaction.id === lastUpdateId ? 'bg-green-100' : 'hover:bg-gray-50'}`}>
                                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                                    {fund_transaction.date}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                                    {fund_transaction.amount.toLocaleString()} 円
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                    {fund_transaction.description || '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                                    <FundTransactionCreateModal
                                        buttonType='success'
                                        buttonTitle='編集'
                                        data={{
                                            date: fund_transaction.date,
                                            amount: String(fund_transaction.amount),
                                            description: fund_transaction.description || ''
                                        }}
                                        title='編集'
                                        actionUrl={`/auth/fund_transaction/${fund_transaction.id}/update?${queryString}`}
                                    >
                                    </FundTransactionCreateModal>
                                    <FundTransactionCreateModal
                                        buttonType='primary'
                                        buttonTitle='複写'
                                        data={{
                                            date: fund_transaction.date,
                                            amount: String(fund_transaction.amount),
                                            description: fund_transaction.description || ''
                                        }}
                                        title='複写'
                                        actionUrl='/auth/fund_transaction/create'
                                    >
                                    </FundTransactionCreateModal>
                                    <FundTransactionDeleteModal actionUrl={`/auth/fund_transaction/${fund_transaction.id}/delete?${queryString}`} fundTransaction={fund_transaction} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/fund_transaction" query={query} />
            </div >
        </>, { title: '投資用口座入金履歴' }
    );
})
