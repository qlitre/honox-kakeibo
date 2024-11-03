import { createRoute } from 'honox/factory'
import { AssetCategory } from '../../../../@types/dbTypes'

const getDetailQuery = `
        SELECT *
        FROM asset_category
        WHERE id = ?
`

export default createRoute(async (c) => {
    const id = c.req.param('id');
    const db = c.env.DB;
    const { results } = await db.prepare(getDetailQuery).bind(id).all<AssetCategory>();

    if (results.length === 0) {
        return c.json({ error: "AssetCategory not found" }, 404);
    }

    return c.json(results[0], 200);
});

export const PUT = createRoute(async (c) => {
    const db = c.env.DB
    const { name } = await c.req.json();
    const id = c.req.param('id')
    try {
        const updateQuery = `
        UPDATE asset_category
        SET name = ?
        WHERE ID = ?;
    `;
        const updateResult = await db.prepare(updateQuery)
            .bind(name, id ?? null)
            .run();
        if (!updateResult.success) {
            throw new Error("Failed to update asset_category");
        }
        const { results } = await db.prepare(getDetailQuery).bind(id).all<AssetCategory>();
        if (results.length === 0) {
            return c.json({ error: "AssetCategory not found" }, 404);
        }
        return c.json(results[0], 201)
    } catch (error) {
        console.error('Error update asset_category', error)
        return c.json({ error: 'Failed to update asset_category' }, 500)
    }
})

export const DELETE = createRoute(async (c) => {
    const db = c.env.DB
    const id = c.req.param('id')
    try {
        const deleteQuery = `
        DELETE FROM asset_category
        WHERE ID = ?;
    `;
        const deleteResult = await db.prepare(deleteQuery)
            .bind(id ?? null)
            .run();
        if (!deleteResult.success) {
            throw new Error("Failed to delete asset_category");
        }
        return c.json({ message: '資産カテゴリが正常に削除されました。' }, 200)
    } catch (error: any) {
        console.error('Error delete asset_category', error)
        if (error.message.includes('SQLITE_CONSTRAINT')) {
            return c.json({ error: 'このカテゴリは使用されているため削除できません。' }, 409)
        }
        return c.json({ error: '資産カテゴリの削除に失敗しました。' }, 500)
    }
})