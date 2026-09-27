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

  // 有効なテンプレートごとに、対象月・同カテゴリで説明にパターンを含む最新の支出を1件 JOIN する。
  // パターンの % _ \ は LIKE のワイルドカードではなく文字として扱う（ESCAPE '\'）
  const sql = String.raw`
    SELECT
      ect.id,
      ect.name,
      ect.description_pattern,
      ect.expense_category_id,
      ec.name AS category_name,
      ect.payment_method_id,
      pm.name AS payment_method_name,
      e.id AS expense_id,
      e.date AS expense_date,
      e.amount AS expense_amount,
      e.description AS expense_description
    FROM expense_check_template ect
    LEFT JOIN expense_category ec ON ect.expense_category_id = ec.id
    LEFT JOIN payment_method pm ON ect.payment_method_id = pm.id
    LEFT JOIN expense e ON e.id = (
      SELECT e2.id
      FROM expense e2
      WHERE e2.expense_category_id = ect.expense_category_id
        AND e2.description LIKE '%' || REPLACE(REPLACE(REPLACE(
          ect.description_pattern, '\', '\\'), '%', '\%'), '_', '\_') || '%' ESCAPE '\'
        AND e2.date LIKE ? ESCAPE '\'
      ORDER BY e2.date DESC
      LIMIT 1
    )
    WHERE ect.is_active = 1
    ORDER BY ect.name
  `

  type ResultRow = ExpenseCheckResult['template'] & {
    expense_id: number | null
    expense_date: string
    expense_amount: number
    expense_description: string
  }
  const { results } = await db
    .prepare(sql)
    .bind(`${escapeLike(targetDate)}%`)
    .all<ResultRow>()

  return results.map(
    ({ expense_id, expense_date, expense_amount, expense_description, ...template }) => ({
      template,
      expense:
        expense_id === null
          ? null
          : {
              id: expense_id,
              date: expense_date,
              amount: expense_amount,
              description: expense_description,
            },
      isRegistered: expense_id !== null,
    })
  )
}
