import type { Income } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { alertCookieMaxage, successAlertCookieKey } from '@/settings/kakeiboSettings';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    income_category_id: z.string(),
    description: z.string()
});

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        // 万が一失敗した時の考慮をどうするか。
        if (!result.success) {
            c.redirect('/auth/income', 303);
        }
    }),
    async (c) => {
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
        const response = await client.addData<Income>({ endpoint: 'income', data: body })
            .catch((e) => { console.error(e) })
        if (response) {
            setCookie(c, successAlertCookieKey, '収入追加に成功しました', { maxAge: alertCookieMaxage })
            return c.redirect(`/auth/income?lastUpdate=${response.id}`, 303);
        }
    })