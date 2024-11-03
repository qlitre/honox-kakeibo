import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Asset } from '../../../@types/dbTypes';
import { KakeiboClient } from '../../../libs/kakeiboClient';


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
        const token = c.env.HONO_IS_COOL
        const client = new KakeiboClient(token)
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
        const response = await client.addData<Asset>({ endpoint: 'asset', data: body })
            .catch((e) => { console.error(e) })

        return c.redirect('/auth/asset', 303);
    })