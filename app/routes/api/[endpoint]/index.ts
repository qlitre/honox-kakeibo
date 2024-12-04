import type { TableName } from '@/utils/sqlUtils';
import { createRoute } from 'honox/factory'
import {
    generateSelectQuery,
    getAndValidateFormData,
    generateInsertQuery,
    generateQueryBindValues,
    buildSqlWhereClause,
    buildSqlOrderByClause
} from '@/utils/sqlUtils'
import { schema } from '@/utils/sqlSchema';


export default createRoute(async (c) => {
    const tableName = c.req.param('endpoint') as TableName;
    if (!(tableName in schema)) {
        return c.json({ error: 'Invalid endpoint' }, 400);
    }

    const db = c.env.DB;
    const _limit = c.req.query('limit') || '10';
    const _offset = c.req.query('offset') || '0';
    const limit = parseInt(_limit);
    const offset = parseInt(_offset);
    let query = generateSelectQuery(tableName)
    let countQuery = `SELECT COUNT(*) as totalCount FROM ${tableName}`;

    const filters = c.req.query('filters');
    if (filters) {
        const whereClause = buildSqlWhereClause(tableName, filters);
        query += ` ${whereClause}`;
        countQuery += ` ${whereClause}`;
    }

    const orderParams = c.req.query('orders');
    if (orderParams) {
        const orderByClause = buildSqlOrderByClause(tableName, orderParams);
        query += ` ${orderByClause}`;
    }

    query += ` LIMIT ? OFFSET ?`;
    try {
        const { results } = await db.prepare(query).bind(limit, offset).all();
        const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();

        const items = results ?? [];
        const totalCount = totalCountResult?.totalCount ?? 0;
        const pageSize = Math.ceil(totalCount / limit);

        const response = {
            contents: items,
            totalCount,
            limit,
            offset,
            pageSize,
        };

        return c.json(response, 200);
    } catch (error) {
        console.error('Error executing query', error);
        return c.json({ error: 'Failed to fetch data' }, 500);
    }
});

export const POST = createRoute(async (c) => {
    const db = c.env.DB;
    const tableName = c.req.param('endpoint') as TableName; // 型キャストで解決
    if (!(tableName in schema)) {
        return c.json({ error: 'Invalid endpoint' }, 400);
    }
    const formData = await c.req.json()
    const { data, isValid, error } = await getAndValidateFormData(formData, tableName);
    // バリデーションチェック
    if (!isValid) {
        return c.json({ error }, 400);
    }
    if (!data) return
    // INSERTクエリとバインドする値を生成
    const insertQuery = await generateInsertQuery(tableName);
    const values = await generateQueryBindValues(tableName, data);
    try {
        const insertResult = await db.prepare(insertQuery)
            .bind(...values)
            .run();
        if (!insertResult.success) {
            throw new Error(`Failed to add ${tableName}`);
        }

        let query = generateSelectQuery(tableName)
        query += ` ORDER BY ${tableName}.created_at DESC LIMIT 1;`
        const newItem = await db.prepare(query).first();
        return c.json(newItem, 201);
    } catch (error) {
        console.error(`Error adding ${tableName}`, error);
        return c.json({ error: `Failed to add ${tableName}` }, 500);
    }
})

