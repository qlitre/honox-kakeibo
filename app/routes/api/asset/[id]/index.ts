import { createRoute } from 'honox/factory'
import { AssetWithCategory } from '../../../../@types/dbTypes'

const getDetailQuery = `
        SELECT asset.id, asset.date, asset.amount, asset.asset_category_id, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
        WHERE asset.id = ?
`

export default createRoute(async (c) => {
    const id = c.req.param('id');
    const db = c.env.DB;
    const { results } = await db.prepare(getDetailQuery).bind(id).all<AssetWithCategory>();

    if (results.length === 0) {
        return c.json({ error: "Asset not found" }, 404);
    }

    return c.json(results[0], 200);
});

export const PUT = createRoute(async (c) => {
    const db = c.env.DB
    const { date, amount, asset_category_id, description } = await c.req.json();
    const id = c.req.param('id')
    if (!date || !amount || !asset_category_id) {
        return c.json({ error: 'date, amount, and asset_category_id are required' }, 400);
    }
    try {
        const updateQuery = `
        UPDATE asset
        SET date = ?,
            amount = ?,
            asset_category_id = ?,
            description = ?
        WHERE ID = ?;
    `;
        const updateResult = await db.prepare(updateQuery)
            .bind(date, amount, asset_category_id, description, id ?? null)
            .run();
        if (!updateResult.success) {
            throw new Error("Failed to update asset");
        }
        const { results } = await db.prepare(getDetailQuery).bind(id).all<AssetWithCategory>();
        if (results.length === 0) {
            return c.json({ error: "Asset not found" }, 404);
        }
        return c.json(results[0], 201)
    } catch (error) {
        console.error('Error update asset', error)
        return c.json({ error: 'Failed to update asset' }, 500)
    }
})

