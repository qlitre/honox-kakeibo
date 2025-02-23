import type { Asset, AssetWithCategoryResponse } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { successAlertCookieKey, dangerAlertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';
import { getBeginningOfMonth, getEndOfMonth } from '@/utils/dashboardUtils';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    asset_category_id: z.string(),
    description: z.string()
});

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        // 作成と同様に失敗した時をどうするか。
        if (!result.success) {
            c.redirect('/auth/asset', 303);
        }
    }),
    async (c) => {
        const id = c.req.param('id')
        const redirectPage = c.req.query('redirectPage')
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { date, amount, asset_category_id, description } = c.req.valid('form')
        const parsedAmount = Number(amount);
        const parsedCategoryId = Number(asset_category_id);
        if (isNaN(parsedAmount) || isNaN(parsedCategoryId)) {
            return c.json({ error: 'Invalid number format' }, 400);
        }
        const body = {
            date: date,
            amount: parsedAmount,
            asset_category_id: parsedCategoryId,
            description: description
        }
        const oldData = await client.getDetail<Asset>({ endpoint: 'asset', contentId: id })
        // 違うカテゴリーに切り替えて登録済みだったらエラー。
        if (oldData.asset_category_id !== parsedCategoryId) {
            const [yearStr, monthStr] = date.split("-");
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10);
            const ge = getBeginningOfMonth(year, month)
            const le = getEndOfMonth(year, month)
            const r = await client.getListResponse<AssetWithCategoryResponse>({
                endpoint: 'asset', queries: {
                    filters: `asset_category_id[eq]${parsedCategoryId}[and]date[greater_equal]${ge}[and]date[less_equal]${le}`
                }
            })
            if (r.totalCount > 0) {
                setCookie(c, dangerAlertCookieKey, '資産編集に失敗しました。同月に同カテゴリの資産が登録されています。', { maxAge: alertCookieMaxage })
                return c.redirect('/auth/asset', 303);
            }
        }
        const queryString = c.req.url.split('?')[1] || '';
        const response = await client.updateData<Asset>({ endpoint: 'asset', contentId: id, data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, successAlertCookieKey, '資産編集に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect(`/auth/asset?lastUpdate=${id}&${queryString}`, 303);
    })