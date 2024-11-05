import { createRoute } from 'honox/factory'
import { AssetCategoryResponse, AssetWithCategoryResponse } from '@/@types/dbTypes'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { AssetDeleteModal } from '@/islands/asset/AssetDeleteModal'
import { AlertSuccess } from '@/islands/share/AlertSuccess'
import { getCookie } from 'hono/cookie'
import { alertCookieKey } from '@/settings/kakeiboSettings'
import { AssetCreateModal } from '@/islands/asset/AssetCreateModal'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = 10
    const offset = limit * (p - 1)
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const assets = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset', queries: {
            orders: '-date,asset_category_id',
            limit: limit,
            offset: offset
        }
    })
    const categories = await client.getListResponse<AssetCategoryResponse>({
        endpoint: 'asset_category', queries: {
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
                    <PageHeader title="資産リスト" />
                    <AssetCreateModal
                        buttonType='primary'
                        buttonTitle='資産追加'
                        title='資産追加'
                        actionUrl='/auth/asset/create'
                        categories={categories} >
                    </AssetCreateModal>
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
                                        {assets.contents.map((asset) => (
                                            <tr key={asset.id} className="hover:bg-gray-50">
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
                                                        actionUrl={`/auth/asset/${asset.id}/update`}
                                                        categories={categories} key={asset.id}>
                                                    </AssetCreateModal>
                                                    <AssetDeleteModal actionUrl={`/auth/asset/${asset.id}/delete`} asset={asset} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <Pagination pageSize={pageSize} currentPage={p} hrefPrefix="/auth/asset" query={query} />
            </div>
        </>, { title: '資産リスト' }
    );
})
