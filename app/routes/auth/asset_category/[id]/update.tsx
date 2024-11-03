import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AssetCategory, } from '../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../libs/kakeiboClient';
import { AssetCategoryCreateForm } from '../../../../islands/AssetCategoryCreateForm';

const schema = z.object({
    name: z.string().min(1),
});

const formTitle = '資産カテゴリ編集'
const formActionUrl = (id: string) => `/auth/asset_category/${id}/update`

export default createRoute(async (c) => {
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
    const id = c.req.param('id')
    const assetDetail = await client.getDetail<AssetCategory>({ endpoint: 'asset_category', contentId: id })
    return c.render(
        <>
            <AssetCategoryCreateForm data={{
                name: assetDetail.name,
            }} title={formTitle} actionUrl={formActionUrl(id)}></AssetCategoryCreateForm>
        </>,
        { title: '資産カテゴリ編集' }
    )
})


export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        if (!result.success) {
            const id = c.req.param('id')
            const { name } = result.data
            return c.render(
                <AssetCategoryCreateForm data={{ name, error: result.error.flatten().fieldErrors }}
                    title={formTitle} actionUrl={formActionUrl(id)} />)
        }
    }),
    async (c) => {
        const id = c.req.param('id')
        const token = c.env.HONO_IS_COOL
        const client = new KakeiboClient(token)
        const { name } = c.req.valid('form')
        const body = {
            name
        }
        const response = await client.updateData<AssetCategory>({ endpoint: 'asset_category', contentId: id, data: body })
            .catch((e) => { console.error(e) })
        return c.redirect('/auth/asset_category', 303);
    })