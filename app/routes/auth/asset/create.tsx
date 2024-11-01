import { createRoute } from 'honox/factory'
import { Header } from '../../../islands/Header'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Asset, AssetCategory, ListResponse } from '../../../@types/dbTypes';
import { KakeiboClient } from '../../../libs/kakeiboClient';
import { AssetCreateForm } from '../../../islands/AssetCreateForm';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    asset_category_id: z.string(),
    description: z.string()
});


export default createRoute(async (c) => {
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
    const categories = await client.getListResponse<ListResponse<AssetCategory>>({ endpoint: 'asset_category', queries: { limit: 100 } })
    return c.render(
        <div>
            <Header></Header>
            <AssetCreateForm title='資産追加' actionUrl='/auth/asset/create' categories={categories}></AssetCreateForm>
        </div>,
        { title: '資産追加' }
    )
})


export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        if (!result.success) {
            const token = c.env.HONO_IS_COOL
            const client = new KakeiboClient(token)
            const categories = await client.getListResponse<ListResponse<AssetCategory>>({ endpoint: 'asset_category', queries: { limit: 100 } })
            const { date, amount, asset_category_id, description } = result.data
            return c.render(
                <AssetCreateForm data={{ date, amount, asset_category_id, description, error: result.error.flatten().fieldErrors }}
                    title='資産追加'
                    actionUrl='/auth/asset/create'
                    categories={categories} />)
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

        return c.redirect('/auth', 303);
    })