import type { TableHeaderItem } from '@/@types/common'
import type { AssetCategoryResponse, AssetWithCategoryResponse } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { AssetDeleteModal } from '@/islands/asset/AssetDeleteModal'
import { Alert } from '@/islands/share/Alert'
import { getCookie } from 'hono/cookie'
import { successAlertCookieKey, dangerAlertCookieKey } from '@/settings/kakeiboSettings'
import { AssetCreateModal } from '@/islands/asset/AssetCreateModal'
import { Table } from '@/components/share/Table'
import { kakeiboPerPage } from '@/settings/kakeiboSettings'
import { getQueryString } from '@/utils/getQueryString'


export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = kakeiboPerPage
    const offset = limit * (p - 1)
    const baseUrl = c.env.BASE_URL
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: baseUrl })
    const assets = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset', queries: {
            orders: '-date,asset_category_id',
            limit: limit,
            offset: offset
        }
    })
    const categories = await client.getListResponse<AssetCategoryResponse>({
        endpoint: 'asset_category', queries: {
            limit: 100,
            orders: 'updated_at'
        }
    })
    const pageSize = assets.pageSize
    const query = c.req.query()
    const successMessage = getCookie(c, successAlertCookieKey)
    const dangerMessage = getCookie(c, dangerAlertCookieKey)
    const headers: TableHeaderItem[] = [
        { name: '日付', textPosition: 'left' },
        { name: 'カテゴリ', textPosition: 'left' },
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
                {dangerMessage && <Alert message={dangerMessage} type='danger'></Alert>}
                <div className="flex items-center justify-between">
                    <PageHeader title="資産リスト" />
                    <AssetCreateModal
                        buttonType='primary'
                        buttonTitle='資産追加'
                        title='作成'
                        actionUrl='/auth/asset/create'
                        categories={categories} >
                    </AssetCreateModal>
                </div>
                <Table headers={headers}>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {assets.contents.map((asset) => (
                            <tr key={asset.id}
                                className={`${asset.id === lastUpdateId ? 'bg-green-100' : 'hover:bg-gray-50'}`}>
                                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                                    {asset.date}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {asset.category_name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                                    {asset.amount.toLocaleString()} 円
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                                    {asset.description || '-'}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                                    <AssetCreateModal
                                        buttonType='success'
                                        buttonTitle='編集'
                                        data={{
                                            date: asset.date,
                                            amount: String(asset.amount),
                                            asset_category_id: String(asset.asset_category_id),
                                            description: asset.description || ''
                                        }}
                                        title='編集'
                                        actionUrl={`/auth/asset/${asset.id}/update?${queryString}`}
                                        categories={categories}>
                                    </AssetCreateModal>
                                    <AssetCreateModal
                                        buttonType='primary'
                                        buttonTitle='複写'
                                        data={{
                                            date: asset.date,
                                            amount: String(asset.amount),
                                            asset_category_id: String(asset.asset_category_id),
                                            description: asset.description || ''
                                        }}
                                        title='複写'
                                        actionUrl='/auth/asset/create'
                                        categories={categories}>
                                    </AssetCreateModal>
                                    <AssetDeleteModal actionUrl={`/auth/asset/${asset.id}/delete?${queryString}`} asset={asset} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/asset" query={query} />
            </div>
        </>, { title: '資産リスト' }
    );
})
