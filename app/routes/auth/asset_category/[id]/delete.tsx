import { createRoute } from 'honox/factory'
import type { AssetCategory } from '../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../libs/kakeiboClient';
import { AssetCategoryDeleteForm } from '../../../../islands/AssetCategoryDeleteForm';

export default createRoute(async (c) => {
    const id = c.req.param('id')
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
    const detail = await client.getDetail<AssetCategory>({ endpoint: 'asset_category', contentId: id })
    return c.render(
        <>
            <AssetCategoryDeleteForm detail={detail} />
        </>, { title: '資産削除' }
    );
})

// frontend
export const POST = createRoute(
    async (c) => {
        const id = c.req.param('id')
        const token = c.env.HONO_IS_COOL
        const client = new KakeiboClient(token)
        try {
            const r = await client.deleteData<AssetCategory>({ endpoint: 'asset_category', contentId: id })
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