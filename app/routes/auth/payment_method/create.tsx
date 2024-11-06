import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { PaymentMethod } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { CategoryCreateForm } from '@/components/share/CategoryCreateForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';

const schema = z.object({
    name: z.string().min(1),
});
const endPoint = 'payment_method'
const actionUrl = `/auth/${endPoint}/create`
const redirectUrl = `/auth/${endPoint}`
const title = '支払い方法追加'
const successMesage = '支払い方法追加に成功しました'

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
                <CategoryCreateForm data={{ name, error: result.error.flatten().fieldErrors }}
                    title={title}
                    actionUrl={actionUrl} />)
        }
    }),
    async (c) => {
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { name } = c.req.valid('form')
        const body = {
            name
        }
        const response = await client.addData<PaymentMethod>({ endpoint: endPoint, data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, alertCookieKey, successMesage, { maxAge: alertCookieMaxage })
        return c.redirect(redirectUrl, 303);
    })