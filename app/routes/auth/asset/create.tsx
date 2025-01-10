import type { Asset, AssetWithCategoryResponse } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { alertCookieMaxage, successAlertCookieKey, dangerAlertCookieKey } from '@/settings/kakeiboSettings';
import { getBeginningOfMonth, getEndOfMonth } from '@/utils/dashboardUtils';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    asset_category_id: z.string(),
    description: z.string()
});

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        // 万が一失敗した時の考慮をどうするか。
        if (!result.success) {
            c.redirect('/auth/asset', 303);
        }
    }),
    async (c) => {
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
        // ハイフンで分割
        const [yearStr, monthStr] = date.split("-");
        // 数値に変換
        const year = parseInt(yearStr, 10); // 年
        const month = parseInt(monthStr, 10); // 月
        const ge = getBeginningOfMonth(year, month)
        const le = getEndOfMonth(year, month)
        const r = await client.getListResponse<AssetWithCategoryResponse>({
            endpoint: 'asset', queries: {
                filters: `asset_category_id[eq]${parsedCategoryId}[and]date[greater_equal]${ge}[and]date[less_equal]${le}`
            }
        })
        if (r.totalCount > 0) {
            setCookie(c, dangerAlertCookieKey, '資産追加に失敗しました。同月に同カテゴリの資産が登録されています。', { maxAge: alertCookieMaxage })
            return c.redirect('/auth/asset', 303);
        }
        const response = await client.addData<Asset>({ endpoint: 'asset', data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, successAlertCookieKey, '資産追加に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect('/auth/asset', 303);
    })