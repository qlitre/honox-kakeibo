import type { IncomeCategoryResponse } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient'
import { getCookie } from 'hono/cookie'
import { successAlertCookieKey } from '@/settings/kakeiboSettings'
import { CategoryList } from '@/components/share/CategoryList'

export default createRoute(async (c) => {
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const message = getCookie(c, successAlertCookieKey)
    const pageTitle = '収入カテゴリ一覧'
    const endPoint = 'income_category'
    const categories = await client.getListResponse<IncomeCategoryResponse>({
        endpoint: endPoint, queries: {
            orders: 'id',
            limit: 100
        }
    })
    return c.render(
        <>
            <CategoryList message={message} categories={categories.contents} pageTitle={pageTitle} endpoint={endPoint}></CategoryList>
        </>,
        { title: pageTitle }
    )
})
