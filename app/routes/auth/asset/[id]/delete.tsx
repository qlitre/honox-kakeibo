import { createRoute } from 'honox/factory'
import { AssetWithCategory } from '../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../libs/kakeiboClient';

export default createRoute(async (c) => {
    const id = c.req.param('id')
    const token = c.env.HONO_IS_COOL
    const client = new KakeiboClient(token)
    const detail = await client.getDetail<AssetWithCategory>({ endpoint: 'asset', contentId: id })
    return c.render(
        <>
            <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg bg-white shadow-md">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">資産削除</h1>
                <div className="mb-4">
                    <p className="text-lg mb-2">
                        <strong>詳細：</strong> {detail?.description || '説明なし'}
                    </p>
                    <p className="text-lg mb-2">
                        <strong>カテゴリ：</strong> {detail?.category_name}
                    </p>
                    <p className="text-lg font-semibold">
                        <strong>金額：</strong> {detail?.amount}円
                    </p>
                </div>
                <form action={`/auth/asset/${id}/delete`} method="post" className="flex justify-center">
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                    >
                        削除
                    </button>
                </form>
            </div>
        </>, { title: '資産削除' }
    );
})


export const POST = createRoute(
    async (c) => {
        const id = c.req.param('id')
        const token = c.env.HONO_IS_COOL
        const client = new KakeiboClient(token)
        const response = await client.deleteData({ endpoint: 'asset', contentId: id })
            .catch((e) => { console.error(e) })
        return c.redirect('/auth/asset', 303);
    })