import { createRoute } from 'honox/factory'
import { findAssetCategories } from '../../db'
import { ListResponse, AssetCategory, AssetWithCategory } from '../../@types/dbTypes'

export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '100'
    const _offset = c.req.query('offset') || '0'
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)
    // findAssetsを呼び出してリストデータを取得
    const response: ListResponse<AssetCategory> = await findAssetCategories(db, limit, offset);
    // JSONレスポンスとして返す
    return c.json(response);
})