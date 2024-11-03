import { createRoute } from 'honox/factory'
import { AssetCategoryResponse, AssetCategory } from '../../../@types/dbTypes'

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
    const response: AssetCategoryResponse = {
        contents: asset_categories,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
    };
    // JSONレスポンスとして返す
    return c.json(response, 200);
})

export const POST = createRoute(async (c) => {
    const db = c.env.DB
    const { name } = await c.req.json();
    if (!name) {
        return c.json({ error: 'name required' }, 400);
    }
    try {
        const insertQuery = `
        INSERT INTO asset_category (name)
        VALUES (?)
    `;
        const insertResult = await db.prepare(insertQuery)
            .bind(name ?? null)
            .run();
        if (!insertResult.success) {
            throw new Error("Failed to add asset_category");
        }
        const selectQuery = `
        SELECT * FROM asset_category
        ORDER BY created_at DESC
        LIMIT 1
        `;
        const newAssetCategory = await db.prepare(selectQuery).first<AssetCategory>();
        return c.json(newAssetCategory, 201)
    } catch (error) {
        console.error('Error adding asset_category', error)
        return c.json({ error: 'Failed to add asset_category' }, 500)
    }
})
