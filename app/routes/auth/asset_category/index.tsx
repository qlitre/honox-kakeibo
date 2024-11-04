import { createRoute } from 'honox/factory'
import { AssetCategoryResponse } from '../../../@types/dbTypes'
import { KakeiboClient } from '../../../libs/kakeiboClient'
import { PageHeader } from '../../../components/PageHeader'
import { getCookie } from 'hono/cookie'
import { AlertSuccess } from '../../../islands/AlertSuccess'
import { alertCookieKey } from '../../../settings/kakeiboSettings'

export default createRoute(async (c) => {
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
    const asset_categories = await client.getListResponse<AssetCategoryResponse>({
        endpoint: 'asset_category', queries: {
            orders: 'id'
        }
    })
    const message = getCookie(c, alertCookieKey)
    return c.render(
        <>
            <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    {message && <AlertSuccess message={message} />}
                    <div className="flex justify-between items-center mb-4">
                        <PageHeader className='mb-0 md:mb-0' title='資産カテゴリ一覧' />
                        <a
                            href="/auth/asset_category/create"
                            className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors"
                        >
                            カテゴリ追加
                        </a>
                    </div>
                    <ul className="space-y-2">
                        {asset_categories.contents.map((category) => (
                            <li
                                key={category.id}
                                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 flex justify-between items-center"
                            >
                                <span className="text-gray-700 font-medium">{category.name}</span>
                                <div className="flex space-x-4">
                                    <a
                                        href={`/auth/asset_category/${category.id}/update`}
                                        className="text-blue-500 hover:underline"
                                    >
                                        編集
                                    </a>
                                    <a
                                        href={`/auth/asset_category/${category.id}/delete`}
                                        className="text-red-500 hover:underline"
                                    >
                                        削除
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>,
        { title: '資産カテゴリ一覧' }
    )
})
