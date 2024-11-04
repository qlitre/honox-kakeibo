import { createRoute } from 'honox/factory'
import { ExpenseWithDetailsResPonse, ExpenseWithDetails } from '../../../@types/dbTypes'
import { buildSqlWhereClause, buildSqlOrderByClause } from '../../../utils/sqlUtils'

export default createRoute(async (c) => {
    const db = c.env.DB
    const _limit = c.req.query('limit') || '10'
    const _offset = c.req.query('offset') || '0'
    const filters = c.req.query('filters')
    const limit = parseInt(_limit)
    const offset = parseInt(_offset)
    let query = `
        SELECT 
            expense.id,
            expense.date,
            expense.amount,
            expense.expense_category_id,
            expense.payment_method_id,
            expense.description,
            expense.created_at,
            expense.updated_at,
            expense_category.name AS category_name,
            payment_method.method_name AS payment_method_name
        FROM 
            expense
        JOIN 
            expense_category 
        ON 
            expense.expense_category_id = expense_category.id
        JOIN 
            payment_method 
        ON 
            expense.payment_method_id = payment_method.id
    `;
    let countQuery = `
        SELECT COUNT(*) as totalCount
        FROM expense
    `;
    if (filters) {
        const whereClause = buildSqlWhereClause('expense', filters)
        query += ` ${whereClause}`
        countQuery += ` ${whereClause}`
    }
    const orderParams = c.req.query('orders')
    if (orderParams) {
        const orderByClause = buildSqlOrderByClause('expense', orderParams)
        query += ` ${orderByClause}`
    }
    query += ` LIMIT ? OFFSET ?`;
    const { results } = await db.prepare(query).bind(limit, offset).all<ExpenseWithDetails>();

    const totalCountResult = await db.prepare(countQuery).first<{ totalCount: number }>();
    // Set up ListResponse
    const expense = results ?? [];
    const totalCount = totalCountResult?.totalCount ?? 0;
    const pageSize = Math.ceil(totalCount / limit)
    const response: ExpenseWithDetailsResPonse = {
        contents: expense,
        totalCount: totalCount,
        limit: limit,
        offset: offset,
        pageSize: pageSize,
    };
    return c.json(response, 200);
})

export const POST = createRoute(async (c) => {

})

