import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AssetCategory } from '../../../@types/dbTypes';
import { KakeiboClient } from '../../../libs/kakeiboClient';
import { AssetCategoryCreateForm } from '../../../islands/AssetCategoryCreateForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '../../../settings/kakeiboSettings';

const schema = z.object({
    name: z.string().min(1),
});

export default createRoute(async (c) => {
    return c.render(
        <>
            <AssetCategoryCreateForm title='カテゴリ追加' actionUrl='/auth/asset_category/create'></AssetCategoryCreateForm>
        </>,
        { title: '資産カテゴリ追加' }
    )
})


export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        if (!result.success) {
            const { name } = result.data
            return c.render(
                <AssetCategoryCreateForm data={{ name, error: result.error.flatten().fieldErrors }}
                    title='カテゴリ追加'
                    actionUrl='/auth/asset_category/create' />)
        }
    }),
    async (c) => {
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { name } = c.req.valid('form')
        const body = {
            name
        }
        const response = await client.addData<AssetCategory>({ endpoint: 'asset_category', data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, alertCookieKey, '資産カテゴリ追加に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect('/auth/asset_category', 303);
    })