import type { TableName } from "@/utils/sqlUtils";
import {
  generateSelectQuery,
  buildSqlOrderByClause,
  buildSqlWhereClause,
  generateInsertQuery,
  generateUpdateQuery,
  generateQueryBindValues,
  generateSummaryQuery,
} from "@/utils/sqlUtils";

/* ---------- 共通レスポンス型 ---------- */
export interface ListResponse<T> {
  contents: T[];
  totalCount: number;
  limit: number;
  offset: number;
  pageSize: number;
}

/* ---------- 一覧取得 (フィルタ／ソート有) ---------- */
export async function fetchListWithFilter<T>(params: {
  db: D1Database;
  table: TableName;
  filters?: string;
  orders?: string;
  limit: number;
  offset: number;
}): Promise<ListResponse<T>> {
  const { db, table, filters, orders, limit, offset } = params;

  let sql = generateSelectQuery(table);
  let countSql = `SELECT COUNT(*) AS total FROM ${table}`;

  if (filters) {
    const where = buildSqlWhereClause(table, filters);
    sql += ` ${where}`;
    countSql += ` ${where}`;
  }

  if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`;
  }

  sql += ` LIMIT ? OFFSET ?`;

  const { results } = await db.prepare(sql).bind(limit, offset).all();
  const total =
    (await db.prepare(countSql).first<{ total: number }>())?.total ?? 0;

  return {
    contents: results as T[],
    totalCount: total,
    limit,
    offset,
    pageSize: Math.ceil(total / limit),
  };
}

/* ---------- 一覧取得 (フィルタなし) ---------- */
export async function fetchSimpleList<T>(params: {
  db: D1Database;
  table: TableName;
  orders?: string;
  limit?: number;
}): Promise<ListResponse<T>> {
  const { db, table, orders, limit = 100 } = params;

  let sql = generateSelectQuery(table);
  if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`;
  }
  sql += ` LIMIT ${limit}`;

  const { results } = await db.prepare(sql).all();

  return {
    contents: results as T[],
    totalCount: results.length,
    limit,
    offset: 0,
    pageSize: 1,
  };
}

/* ---------- 単一詳細取得 ---------- */
export async function fetchDetail<T>(params: {
  db: D1Database;
  table: TableName;
  id: number | string;
}): Promise<T | null> {
  const { db, table, id } = params;

  const sql = `${generateSelectQuery(table)} WHERE ${table}.id = ?`;
  const record = await db.prepare(sql).bind(id).first<T>();

  return record ?? null;
}

/* ---------- レコード追加 (CREATE) ---------- */
export async function createItem<T>(params: {
  db: D1Database;
  table: TableName;
  data: Record<string, unknown>;
}): Promise<T> {
  const { db, table, data } = params;

  const insertSql = await generateInsertQuery(table);
  const values = await generateQueryBindValues(table, data);

  const insertResult = await db
    .prepare(insertSql)
    .bind(...values)
    .run();
  if (!insertResult.success) {
    throw new Error(`Failed to insert into ${table}`);
  }

  // 直前に入れた行を取得
  const lastId =
    (insertResult.meta as { last_row_id?: number }).last_row_id ?? undefined;

  if (lastId === undefined) {
    throw new Error(`Cannot fetch last_row_id for ${table}`);
  }

  const detail = await fetchDetail<T>({ db, table, id: lastId });
  if (!detail) throw new Error(`Inserted ${table} not found`);

  return detail;
}

/* ---------- レコード更新 (UPDATE) ---------- */
export async function updateItem<T>(params: {
  db: D1Database;
  table: TableName;
  id: number | string;
  data: Record<string, unknown>;
}): Promise<T> {
  const { db, table, id, data } = params;

  const updateSql = await generateUpdateQuery(table);
  const values = await generateQueryBindValues(table, data);

  // updated_at を自動更新するカラムがある場合は utilities 内で生成済み
  values.push(new Date().toISOString().replace("T", " ").split(".")[0]);
  values.push(id);

  const updateResult = await db
    .prepare(updateSql)
    .bind(...values)
    .run();
  if (!updateResult.success) {
    throw new Error(`Failed to update ${table}`);
  }

  const detail = await fetchDetail<T>({ db, table, id });
  if (!detail) throw new Error(`Updated ${table} not found`);

  return detail;
}

/* ---------- レコード削除 (DELETE) ---------- */
export async function deleteItem(params: {
  db: D1Database;
  table: TableName;
  id: number | string;
}): Promise<void> {
  const { db, table, id } = params;

  const deleteSql = `DELETE FROM ${table} WHERE id = ?`;
  const del = await db.prepare(deleteSql).bind(id).run();

  if (!del.success) {
    throw new Error(`Failed to delete from ${table}`);
  }
}

/** 集計結果の型 */
export type SummaryResponse<T> = {
  summary: T[];
};

/**
 * テーブルのサマリー（合計・月次集計など）を取得する
 *
 * @param orders  例: "-date,category_id"       ← 既存（テーブル名を前に付与）
 * @param orderRaw 例: "year_month ASC,total_amount DESC"
 *                 プレフィックスを **付けず** にそのまま渡したいときに使用
 *                 （SELECT 句で定義したエイリアスを並べ替えたい場合など）
 */
export async function fetchSummary<T>(params: {
  db: D1Database;
  table: TableName;
  filters?: string;
  groupBy?: string;
  orders?: string;
  orderRaw?: string; // ⭐ 追加
}): Promise<SummaryResponse<T>> {
  const { db, table, filters, groupBy, orders, orderRaw } = params;

  let sql = generateSummaryQuery(table);

  if (filters) {
    sql += ` ${buildSqlWhereClause(table, filters)}`;
  }
  if (groupBy) {
    sql += ` GROUP BY ${groupBy}`;
  }

  // ── 並べ替え ─────────────────────────────
  if (orderRaw) {
    sql += ` ORDER BY ${orderRaw}`; // alias をそのまま使用
  } else if (orders) {
    sql += ` ${buildSqlOrderByClause(table, orders)}`; // 既存ロジック
  }
  // ─────────────────────────────────────

  const { results } = await db.prepare(sql).all();
  return { summary: results as T[] };
}

/* ---------- 定期支払いチェック ---------- */
export interface ExpenseCheckResult {
  template: {
    id: number;
    name: string;
    description_pattern: string;
    expense_category_id: number;
    category_name: string;
  };
  expense: {
    id: number;
    date: string;
    amount: number;
    description: string;
  } | null;
  isRegistered: boolean;
}

export async function checkMonthlyExpenses(params: {
  db: D1Database;
  year: string;
  month: string;
}): Promise<ExpenseCheckResult[]> {
  const { db, year, month } = params;

  const targetDate = `${year}-${month.padStart(2, "0")}`;

  // チェックテンプレート一覧を取得
  const templatesQuery = `
    SELECT 
      ect.id,
      ect.name,
      ect.description_pattern,
      ect.expense_category_id,
      ec.name as category_name
    FROM expense_check_template ect
    LEFT JOIN expense_category ec ON ect.expense_category_id = ec.id
    WHERE ect.is_active = 1
    ORDER BY ect.name
  `;

  const { results: templates } = await db.prepare(templatesQuery).all();

  // 各テンプレートについて該当する支出があるかチェック
  const checkResults: ExpenseCheckResult[] = [];

  for (const template of templates || []) {
    const expenseQuery = `
      SELECT 
        e.id,
        e.date,
        e.amount,
        e.description
      FROM expense e
      WHERE e.expense_category_id = ?
        AND e.description LIKE ?
        AND e.date LIKE ?
      ORDER BY e.date DESC
      LIMIT 1
    `;

    const expenseResult = await db
      .prepare(expenseQuery)
      .bind(
        template.expense_category_id,
        `%${template.description_pattern}%`,
        `${targetDate}%`,
      )
      .first();

    checkResults.push({
      template: template as ExpenseCheckResult["template"],
      expense: expenseResult as ExpenseCheckResult["expense"],
      isRegistered: !!expenseResult,
    });
  }

  return checkResults;
}
