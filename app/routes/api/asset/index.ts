import { createRoute } from 'honox/factory'
import { AssetWithCategoryResponse, AssetWithCategory } from '../../../@types/dbTypes'


export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '10'
    const _offset = c.req.query('offset') || '0'
    const filters = c.req.query('filters')
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)
    let query = `
        SELECT asset.id, asset.date, asset.amount, asset.description, asset.asset_category_id, asset_category.name AS category_name
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
        SELECT COUNT(*) as totalCount
        FROM asset
        JOIN asset_category ON asset.asset_category_id = asset_category.id
    `;
    if (opes.length > 0) {
        const addChar = opes.join(' AND ')
        query += ` WHERE ${addChar}`
        countQuery += ` WHERE ${addChar}`
    }
    const orderParams = c.req.query('orders')
    if (orderParams) {
        query += ' ORDER BY'
        const fieldsArray = orderParams.split(',')
        const orderClauses = []

        for (const field of fieldsArray) {
            let sortOrder = ''
            let columnName = ''

            if (field[0] === '-') {
                sortOrder = 'DESC'
                columnName = 'asset.' + field.slice(1)
            } else {
                sortOrder = 'ASC'
                columnName = 'asset.' + field
            }
            orderClauses.push(`${columnName} ${sortOrder}`)
        }
        const orderByClause = orderClauses.join(', ') // 並べ替え条件の結合
        query += ` ${orderByClause}`
    }
    const bindParams: any[] = []
    query += ` LIMIT ? OFFSET ?`;
    bindParams.push(limit, offset)
    const { results } = await db.prepare(query).bind(...bindParams).all<AssetWithCategory>();
    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();
    // Set up ListResponse
    const assets = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    const pageSize = Math.ceil(totalCount / limit)
    const response: AssetWithCategoryResponse = {
        contents: assets,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
        pageSize:pageSize,
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
        ORDER BY asset.created_at DESC
        LIMIT 1
        `;
        const newAsset = await db.prepare(selectQuery).first<AssetWithCategory>();
        return c.json(newAsset, 201)
    } catch (error) {
        console.error('Error adding asset', error)
        return c.json({ error: 'Failed to add asset' }, 500)
    }
})

