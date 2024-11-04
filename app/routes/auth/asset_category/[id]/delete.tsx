import { createRoute } from 'honox/factory'
import type { AssetCategory } from '../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../libs/kakeiboClient';
import { AssetCategoryDeleteForm } from '../../../../islands/AssetCategoryDeleteForm';
import { setCookie } from 'hono/cookie';
import { alertCookieKey, alertCookieMaxage } from '../../../../settings/kakeiboSettings';


export default createRoute(async (c) => {
    const id = c.req.param('id')
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const detail = await client.getDetail<AssetCategory>({ endpoint: 'asset_category', contentId: id })
    return c.render(
        <>
            <AssetCategoryDeleteForm detail={detail} />
        </>, { title: '資産削除' }
    );
})


export const POST = createRoute(
    async (c) => {
        const id = c.req.param('id')
        const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
        try {
            const r = await client.deleteData<AssetCategory>({ endpoint: 'asset_category', contentId: id })
            setCookie(c, alertCookieKey, '資産カテゴリの削除に成功しました', { maxAge: alertCookieMaxage })
            return c.redirect('/auth/asset_category', 303)
        } catch (e: any) {
            console.error(e)
            const detail = await client.getDetail<AssetCategory>({ endpoint: 'asset_category', contentId: id })
            const errorMessage = e.message || 'カテゴリの削除中にエラーが発生しました。'
            return c.render(
                <>
                    <AssetCategoryDeleteForm errorMessage={errorMessage} detail={detail} />
                </>, { title: '資産削除' }
            );
        }
    }
)