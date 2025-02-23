import type { Income } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { successAlertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';


const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    income_category_id: z.string(),
    description: z.string()
});

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        // 作成と同様に失敗した時をどうするか。
        if (!result.success) {
            c.redirect('/auth/income', 303);
        }
    }),
    async (c) => {
        const id = c.req.param('id')
        const redirectPage = c.req.query('redirectPage')
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { date, amount, income_category_id, description } = c.req.valid('form')
        const parsedAmount = Number(amount);
        const parsedCategoryId = Number(income_category_id);
        if (isNaN(parsedAmount) || isNaN(parsedCategoryId)) {
            return c.json({ error: 'Invalid number format' }, 400);
        }
        const body = {
            date: date,
            amount: parsedAmount,
            income_category_id: parsedCategoryId,
            description: description
        }
        const response = await client.updateData<Income>({ endpoint: 'income', contentId: id, data: body })
            .catch((e) => { console.error(e) })
        const queryString = c.req.url.split('?')[1] || '';
        setCookie(c, successAlertCookieKey, '収入編集に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect(`/auth/income?lastUpdate=${id}&${queryString}`, 303);
    })