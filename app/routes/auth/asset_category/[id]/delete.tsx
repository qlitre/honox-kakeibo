import type { AssetCategory } from '@/@types/dbTypes';
import { createRoute } from 'honox/factory'
import { KakeiboClient } from '@/libs/kakeiboClient';
import { CategoryDeleteForm } from '@/components/share/CategoryDeleteForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '@/settings/kakeiboSettings';

const endPoint = 'asset_category'
const title = '資産カテゴリ削除削除'
const successMessage = '資産カテゴリの削除に成功しました'
const redirectUrl = '/auth/asset_category'

export default createRoute(async (c) => {
    const id = c.req.param('id')
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const detail = await client.getDetail<AssetCategory>({ endpoint: endPoint, contentId: id })
    return c.render(
        <>
            <CategoryDeleteForm title={title} detail={detail} endPoint={endPoint} />
        </>, { title: title }
    );
})


export const POST = createRoute(
    async (c) => {
        const id = c.req.param('id')
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        try {
            const r = await client.deleteData<AssetCategory>({ endpoint: endPoint, contentId: id })
            setCookie(c, alertCookieKey, successMessage, { maxAge: alertCookieMaxage })
            return c.redirect(redirectUrl, 303)
        } catch (e: any) {
            console.error(e)
            const detail = await client.getDetail<AssetCategory>({ endpoint: endPoint, contentId: id })
            const errorMessage = e.message || 'カテゴリの削除中にエラーが発生しました。'
            return c.render(
                <>
                    <CategoryDeleteForm errorMessage={errorMessage} title={title} detail={detail} endPoint={endPoint} />
                </>, { title: title }
            );
        }
    }
)