import { createRoute } from 'honox/factory'
import { Header } from '../../../islands/Header'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Asset, AssetCategory, ListResponse } from '../../../@types/dbTypes';
import { KakeiboClient } from '../../../libs/kakeiboClient';

const schema = z.object({
    date: z.string().length(10),
    amount: z.string(),
    asset_category_id: z.string(),
    description: z.string()
});

export default createRoute(async (c) => {
    const client = new KakeiboClient('honoiscool')
    const categories = await client.getListResponse<ListResponse<AssetCategory>>({ endpoint: 'asset_category', queries: { limit: 100 } })
    return c.render(
        <div>
            <Header></Header>
            <main className='c-container'>
                <h1 className="text-xl font-bold mb-4">資産追加</h1>
                <form action="/auth/asset/create" method="post" className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            日付
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            金額
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="asset_category_id" className="block text-sm font-medium text-gray-700">
                            カテゴリID
                        </label>
                        <select
                            id="asset_category_id"
                            name="asset_category_id"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            {categories.contents.map((category) => (
                                <option value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            説明
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            資産を追加
                        </button>
                    </div>
                </form>
            </main>
        </div>,
        { title: '資産追加' }
    )
})


export const POST = createRoute(
    zValidator('form', schema, (result, c) => {
        if (!result.success) {
            return c.redirect('/auth/asset/create', 303)
        }
    }), async (c) => {
        const token = 'honoiscool'
        const client = new KakeiboClient(token)
        const { date, amount, asset_category_id, description } = c.req.valid('form')
        const parsedAmount = Number(amount);
        const parsedCategoryId = Number(asset_category_id);
        if (isNaN(parsedAmount) || isNaN(parsedCategoryId)) {
            return c.json({ error: 'Invalid number format' }, 400);
        }
        const body = {
            date: date,
            amount: parsedAmount,
            asset_category_id: parsedCategoryId,
            description: description
        }
        const response = await client.addData<Asset>({ endpoint: 'asset', data: body })
            .catch((e) => { console.error(e) })
        
        return c.redirect('/auth', 303);
    })