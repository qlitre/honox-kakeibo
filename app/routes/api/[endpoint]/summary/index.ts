import type { TableName } from '@/utils/sqlUtils';
import { createRoute } from 'honox/factory';
import { generateSummaryQuery, buildSqlWhereClause } from '@/utils/sqlUtils';
import { schema } from '@/utils/sqlSchema';

export default createRoute(async (c) => {
    const tableName = c.req.param('endpoint') as TableName;
    const db = c.env.DB
    // スキーマに定義されているかチェック
    if (!(tableName in schema)) {
        return c.json({ error: 'Invalid endpoint' }, 400);
    }

    try {
        // SQLクエリを動的に生成
        let sqlQuery = generateSummaryQuery(tableName);
        const filters = c.req.query('filters');
        if (filters) {
            const whereClause = buildSqlWhereClause(tableName, filters);
            sqlQuery += ` ${whereClause}`;
        }
        const groupBy = c.req.query('groupby')
        if (groupBy) {
            sqlQuery += ` GROUP BY ${groupBy}`
        }
        const { results } = await db.prepare(sqlQuery).all()
        const response = {
            summary: results
        }
        return c.json(response, 200);
    } catch (error) {
        return c.json({ error: 'Failed to fetch summary' }, 500);
    }
});