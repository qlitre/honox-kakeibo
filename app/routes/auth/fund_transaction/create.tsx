import type { FundTransation } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { alertCookieMaxage, alertCookieKey } from '@/settings/kakeiboSettings';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    description: z.string()
});

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        // 万が一失敗した時の考慮をどうするか。
        if (!result.success) {
            c.redirect('/auth/fund_transaction', 303);
        }
    }),
    async (c) => {
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { date, amount, description } = c.req.valid('form')
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount)) {
            return c.json({ error: 'Invalid number format' }, 400);
        }
        const body = {
            date: date,
            amount: parsedAmount,
            description: description
        }
        const response = await client.addData<FundTransation>({ endpoint: 'fund_transaction', data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, alertCookieKey, '投資用口座入金履歴追加に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect('/auth/fund_transaction', 303);
    })