import { createRoute } from 'honox/factory'
import { findAssets, addAsset } from '../../db'
import { ListResponse, AssetWithCategory } from '../../@types/dbTypes'

export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '10'
    const _offset = c.req.query('offset') || '0'
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)
    const response: ListResponse<AssetWithCategory> = await findAssets(db, limit, offset);
    return c.json(response);
})

export const POST = createRoute(async (c) => {
    const db = c.env.DB
    // リクエストボディから必要なデータを取得
    const { date, amount, asset_category_id, description } = await c.req.json();
    // バリデーションチェック
    if (!date || !amount || !asset_category_id) {
        return c.json({ error: 'date, amount, and asset_category_id are required' }, 400);
    }
    try {
        const newAsset = await addAsset(db, date, amount, asset_category_id, description)
        return c.json(newAsset, 201)
    } catch (error) {
        console.error('Error adding asset', error)
        return c.json({ error: 'Failed to add asset' }, 500)
    }
})

