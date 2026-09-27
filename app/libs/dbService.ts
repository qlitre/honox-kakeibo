import type { RowOf, SummaryItem } from '@/@types/dbTypes'
import type { Filter, SummaryKey, TableName, WhereClause } from '@/utils/sqlUtils'
import {
  generateSelectQuery,
  buildSqlGroupByClause,
  buildSqlOrderByClause,
  buildSqlWhereClause,
  generateInsertQuery,
  generateUpdateQuery,
  generateQueryBindValues,
  generateSummaryQuery,
  escapeLike,
} from '@/utils/sqlUtils'

/* ---------- 共通レスポンス型 ---------- */
interface ListResponse<T> {
  contents: T[]
  totalCount: number
  limit: number
  offset: number
  pageSize: number
}

/* ---------- 一覧取得 (フィルタ／ソート有) ---------- */
export async function fetchListWithFilter<N extends TableName>(params: {
  db: D1Database
  table: N
  filters?: Filter<N>[]
  orders?: string
  limit: number
  offset: number
}): Promise<ListResponse<RowOf[N]>> {
  const { db, table, filters, orders, limit, offset } = params

  let sql = generateSelectQuery(table)
  let countSql = `SELECT COUNT(*) AS total FROM ${table}`
  const where = buildSqlWhereClause(table, filters)
  if (where.sql) {
    sql += ` ${where.sql}`
    countSql += ` ${where.sql}`
  }
  const bindValues: WhereClause['params'] = where.params

  if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`
  }

  sql += ` LIMIT ? OFFSET ?`

  const { results } = await db
    .prepare(sql)
    .bind(...bindValues, limit, offset)
    .all()
  const total =
    (
      await db
        .prepare(countSql)
        .bind(...bindValues)
        .first<{ total: number }>()
    )?.total ?? 0

  return {
    contents: results as RowOf[N][],
    totalCount: total,
    limit,
    offset,
    pageSize: Math.ceil(total / limit),
  }
}

/* ---------- 一覧取得 (フィルタなし) ---------- */
export async function fetchSimpleList<N extends TableName>(params: {
  db: D1Database
  table: N
  orders?: string
  limit?: number
}): Promise<ListResponse<RowOf[N]>> {
  const { db, table, orders, limit = 100 } = params

  let sql = generateSelectQuery(table)
  if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`
  }
  sql += ` LIMIT ?`

  const { results } = await db.prepare(sql).bind(limit).all()

  return {
    contents: results as RowOf[N][],
    totalCount: results.length,
    limit,
    offset: 0,
    pageSize: 1,
  }
}

/* ---------- 全件取得（グラフ用。件数で打ち切らない） ---------- */
export async function fetchAll<N extends TableName>(params: {
  db: D1Database
  table: N
  orders?: string
}): Promise<RowOf[N][]> {
  const { db, table, orders } = params
  let sql = generateSelectQuery(table)
  if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`
  }
  const { results } = await db.prepare(sql).all()
  return results as RowOf[N][]
}

/* ---------- 単一詳細取得 ---------- */
export async function fetchDetail<N extends TableName>(params: {
  db: D1Database
  table: N
  id: number | string
}): Promise<RowOf[N] | null> {
  const { db, table, id } = params

  const sql = `${generateSelectQuery(table)} WHERE ${table}.id = ?`
  const record = await db.prepare(sql).bind(id).first<RowOf[N]>()

  return record ?? null
}

/* ---------- レコード追加 (CREATE) ---------- */
export async function createItem<N extends TableName>(params: {
  db: D1Database
  table: N
  data: Record<string, unknown>
}): Promise<RowOf[N]> {
  const { db, table, data } = params

  // 値が undefined のカラムは入れず、DBの既定値に任せる
  const columns = Object.keys(data).filter((key) => data[key] !== undefined)
  const insertSql = generateInsertQuery(table, columns)
  const values = generateQueryBindValues(table, data).filter((v) => v !== undefined)

  const insertResult = await db
    .prepare(insertSql)
    .bind(...values)
    .run()
  if (!insertResult.success) {
    throw new Error(`Failed to insert into ${table}`)
  }

  // 直前に入れた行を取得
  const lastId = (insertResult.meta as { last_row_id?: number }).last_row_id ?? undefined

  if (lastId === undefined) {
    throw new Error(`Cannot fetch last_row_id for ${table}`)
  }

  const detail = await fetchDetail({ db, table, id: lastId })
  if (!detail) throw new Error(`Inserted ${table} not found`)

  return detail
}

/* ---------- レコード更新 (UPDATE) ---------- */
export async function updateItem<N extends TableName>(params: {
  db: D1Database
  table: N
  id: number | string
  data: Record<string, unknown>
}): Promise<RowOf[N]> {
  const { db, table, id, data } = params

  const updateSql = generateUpdateQuery(table)
  const values = generateQueryBindValues(table, data)

  // updated_at を自動更新するカラムがある場合は utilities 内で生成済み
  values.push(new Date().toISOString().replace('T', ' ').split('.')[0])
  values.push(id)

  const updateResult = await db
    .prepare(updateSql)
    .bind(...values)
    .run()
  if (!updateResult.success) {
    throw new Error(`Failed to update ${table}`)
  }

  const detail = await fetchDetail({ db, table, id })
  if (!detail) throw new Error(`Updated ${table} not found`)

  return detail
}

/** 他のテーブルから参照されている行の削除など、外部キー制約違反か */
export const isForeignKeyConstraintError = (err: unknown): boolean =>
  err instanceof Error && err.message.includes('FOREIGN KEY constraint failed')

/* ---------- レコード削除 (DELETE) ---------- */
export async function deleteItem(params: {
  db: D1Database
  table: TableName
  id: number | string
}): Promise<void> {
  const { db, table, id } = params

  const deleteSql = `DELETE FROM ${table} WHERE id = ?`
  const del = await db.prepare(deleteSql).bind(id).run()

  if (!del.success) {
    throw new Error(`Failed to delete from ${table}`)
  }
}

/**
 * テーブルの年月別サマリー（合計）を取得する。groupBy のキー順に並べる
 *
 * @param groupBy 例: ['year_month', 'category_name']
 */
export async function fetchSummary<N extends TableName>(params: {
  db: D1Database
  table: N
  filters?: Filter<N>[]
  groupBy: SummaryKey<N>[]
}): Promise<{ summary: SummaryItem[] }> {
  const { db, table, filters, groupBy } = params

  const where = buildSqlWhereClause(table, filters)
  const sql = [generateSummaryQuery(table), where.sql, buildSqlGroupByClause(table, groupBy)]
    .filter(Boolean)
    .join(' ')

  const { results } = await db
    .prepare(sql)
    .bind(...where.params)
    .all()
  return { summary: results as SummaryItem[] }
}

/* ---------- 定期支払いチェック ---------- */
interface ExpenseCheckResult {
  template: {
    id: number
    name: string
    description_pattern: string
    expense_category_id: number
    category_name: string
    payment_method_id: number | null
    payment_method_name: string | null
  }
  expense: {
    id: number
    date: string
    amount: number
    description: string
  } | null
  isRegistered: boolean
}

export async function checkMonthlyExpenses(params: {
  db: D1Database
  year: string
  month: string
}): Promise<ExpenseCheckResult[]> {
  const { db, year, month } = params

  const targetDate = `${year}-${month.padStart(2, '0')}`

  // チェックテンプレート一覧を取得
  const templatesQuery = `
    SELECT
      ect.id,
      ect.name,
      ect.description_pattern,
      ect.expense_category_id,
      ec.name as category_name,
      ect.payment_method_id,
      pm.name as payment_method_name
    FROM expense_check_template ect
    LEFT JOIN expense_category ec ON ect.expense_category_id = ec.id
    LEFT JOIN payment_method pm ON ect.payment_method_id = pm.id
    WHERE ect.is_active = 1
    ORDER BY ect.name
  `

  const { results: templates } = await db.prepare(templatesQuery).all()

  // 各テンプレートについて該当する支出があるかチェック
  const checkResults: ExpenseCheckResult[] = []

  for (const template of templates || []) {
    const expenseQuery = `
      SELECT 
        e.id,
        e.date,
        e.amount,
        e.description
      FROM expense e
      WHERE e.expense_category_id = ?
        AND e.description LIKE ? ESCAPE '\\'
        AND e.date LIKE ? ESCAPE '\\'
      ORDER BY e.date DESC
      LIMIT 1
    `

    const expenseResult = await db
      .prepare(expenseQuery)
      .bind(
        template.expense_category_id,
        `%${escapeLike(String(template.description_pattern))}%`,
        `${escapeLike(targetDate)}%`
      )
      .first()

    checkResults.push({
      template: template as ExpenseCheckResult['template'],
      expense: expenseResult as ExpenseCheckResult['expense'],
      isRegistered: !!expenseResult,
    })
  }

  return checkResults
}
