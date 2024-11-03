import { createRoute } from 'honox/factory'
import { AssetCategoryResponse, AssetWithCategoryResponse } from '../../../@types/dbTypes'
import { KakeiboClient } from '../../../libs/kakeiboClient'
import { PageHeader } from '../../../components/PageHeader'
import { Pagination } from '../../../components/Pagination'
import { DeleteModal } from '../../../islands/DeleteModal'
import { EditModal } from '../../../islands/EditModal'
import { CreateModal } from '../../../islands/CreateModal'

export default createRoute(async (c) => {
    let page = c.req.query('page') ?? '1'
    const p = parseInt(page)
    const limit = 10
    const offset = limit * (p - 1)
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
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

    return c.render(
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <PageHeader title="資産リスト" />
                    <CreateModal categories={categories} />
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
                                                    <EditModal asset={asset} categories={categories} />
                                                    <DeleteModal asset={asset} />
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
