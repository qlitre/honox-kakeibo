import { createRoute } from 'honox/factory'
import { ListResponse, AssetCategory } from '../../../@types/dbTypes'

export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '10'
    const _offset = c.req.query('offset') || '0'
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)

    const query = `
        SELECT *
        FROM asset_category
        LIMIT ? OFFSET ?                
    `
    const countQuery = `SELECT COUNT(*) as totalCount FROM asset_category`;
    const { results } = await db.prepare(query).bind(limit, offset).all<AssetCategory>();
    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();

    const asset_categories = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    const response: ListResponse<AssetCategory> = {
        contents: asset_categories,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
    };
    // JSONレスポンスとして返す
    return c.json(response, 200);
})