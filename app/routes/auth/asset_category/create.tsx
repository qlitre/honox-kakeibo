import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { AssetCategory } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { CategoryCreateForm } from '@/components/share/CategoryCreateForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';

const schema = z.object({
    name: z.string().min(1),
    is_investment: z.enum(['1']).optional()
});
const endPoint = 'asset_category'
const actionUrl = `/auth/${endPoint}/create`
const redirectUrl = `/auth/${endPoint}`
const title = '資産カテゴリ追加'
const successMesage = '資産カテゴリ追加に成功しました'

export default createRoute(async (c) => {
    return c.render(
        <>
            <CategoryCreateForm title={title} actionUrl={actionUrl}></CategoryCreateForm>
        </>,
        { title: title }
    )
})

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        if (!result.success) {
            const { name } = result.data
            return c.render(
                <CategoryCreateForm
                    data={{ name, error: result.error.flatten().fieldErrors }}
                    title={title}
                    actionUrl={actionUrl}
                />
            )
        }
    }),
    async (c) => {
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { name, is_investment } = c.req.valid('form')
        let _is_investment = 0
        if (is_investment === '1') _is_investment = 1
        const body = {
            name: name,
            is_investment: _is_investment
        }

        const response = await client.addData<AssetCategory>({ endpoint: endPoint, data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, alertCookieKey, successMesage, { maxAge: alertCookieMaxage })
        return c.redirect(redirectUrl, 303);
    })