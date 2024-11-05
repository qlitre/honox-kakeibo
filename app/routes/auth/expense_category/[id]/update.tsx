import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ExpenseCategory, } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { CategoryCreateForm } from '@/components/share/CategoryCreateForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';

const schema = z.object({
    name: z.string().min(1),
});

const title = '支出カテゴリ編集'
const formActionUrl = (id: string) => `/auth/expense_category/${id}/update`
const endPoint = 'expense_category'
const successMesage = '支出カテゴリの編集に成功しました'
const redirectUrl = '/auth/expense_category'

export default createRoute(async (c) => {
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const id = c.req.param('id')
    const detail = await client.getDetail<ExpenseCategory>({ endpoint: endPoint, contentId: id })
    return c.render(
        <>
            <CategoryCreateForm
                data={{ name: detail.name }}
                title={title}
                actionUrl={formActionUrl(id)}
            />
        </>,
        { title: title }
    )
})

export const POST = createRoute(
    zValidator('form', schema, async (result, c) => {
        if (!result.success) {
            const id = c.req.param('id')
            const { name } = result.data
            return c.render(
                <CategoryCreateForm data={{ name, error: result.error.flatten().fieldErrors }}
                    title={title} actionUrl={formActionUrl(id)} />)
        }
    }),
    async (c) => {
        const id = c.req.param('id')
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        const { name } = c.req.valid('form')
        const body = {
            name
        }
        const response = await client.updateData<ExpenseCategory>({ endpoint: endPoint, contentId: id, data: body })
            .catch((e) => { console.error(e) })
        setCookie(c, alertCookieKey, successMesage, { maxAge: alertCookieMaxage })
        return c.redirect(redirectUrl, 303);
    })