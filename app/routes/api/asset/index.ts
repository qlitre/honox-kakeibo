import { createRoute } from 'honox/factory'
import { ListResponse, AssetWithCategory } from '../../../@types/dbTypes'


export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '10'
    const _offset = c.req.query('offset') || '0'
    const filters = c.req.query('filters')
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)
    let query = `
        SELECT asset.id, asset.date, asset.amount, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id        
    `;

    const opes: string[] = []
    const conditions: Record<string, string> = {
        '[greater_than]': '>',
        '[less_than]': '<',
        '[greater_equal]': '>=',
        '[less_equal]': '<='
    }
    if (filters) {
        //date[greater_equal]2024-11-01[and]date[less_equal]2024-11-30
        //みたいな文字から動的にSQL文をつくる
        for (const chars of filters.split('[and]')) {
            for (const k in conditions) {
                if (chars.indexOf(k) > 0) {
                    const arr = chars.split(k)
                    const field = 'asset.' + arr[0]
                    const ope = conditions[k]
                    const value = arr[1]
                    const str = `${field} ${ope} '${value}'`
                    opes.push(str)
                }
            }
        }
    }
    let countQuery = `
        SELECT COUNT(asset.id) as totalCount
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
    `;
    if (opes) {
        const addChar = opes.join(' AND ')
        query += ` WHERE ${addChar}`
        countQuery += ` WHERE ${addChar}`
    }
    const bindParams: any[] = []
    query += ` ORDER BY asset.date DESC LIMIT ? OFFSET ?`;
    bindParams.push(limit, offset)
    const { results } = await db.prepare(query).bind(...bindParams).all<AssetWithCategory>();


    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();
    // Set up ListResponse
    const assets = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    const response: ListResponse<AssetWithCategory> = {
        contents: assets,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
    };
    return c.json(response, 200);
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
        const insertQuery = `
        INSERT INTO asset (date, amount, asset_category_id, description)
        VALUES (?, ?, ?, ?)
    `;
        const insertResult = await db.prepare(insertQuery)
            .bind(date, amount, asset_category_id, description ?? null)
            .run();
        if (!insertResult.success) {
            throw new Error("Failed to add asset");
        }
        // 挿入した資産を再度取得する
        const selectQuery = `
        SELECT 
        asset.id, asset.date, asset.amount, asset.description, asset_category.name AS category_name
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
        WHERE asset.date = ? AND asset.amount = ? AND asset.asset_category_id = ?
        ORDER BY asset.id DESC
        LIMIT 1
        `;
        const newAsset = await db.prepare(selectQuery).bind(date, amount, asset_category_id).first<AssetWithCategory>();
        return c.json(newAsset, 201)
    } catch (error) {
        console.error('Error adding asset', error)
        return c.json({ error: 'Failed to add asset' }, 500)
    }
})

