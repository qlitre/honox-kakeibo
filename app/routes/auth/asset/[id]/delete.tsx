import { createRoute } from 'honox/factory'
import { KakeiboClient } from '../../../../libs/kakeiboClient';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '../../../../settings/kakeiboSettings';

export const POST = createRoute(
    async (c) => {
        const id = c.req.param('id')
        const token = c.env.HONO_IS_COOL
        const client = new KakeiboClient(token)
        const response = await client.deleteData({ endpoint: 'asset', contentId: id })
            .catch((e) => {
                console.error(e)
                return
            })
        setCookie(c, alertCookieKey, '資産削除に成功しました', { maxAge: alertCookieMaxage })
        return c.redirect('/auth/asset', 303);
    })