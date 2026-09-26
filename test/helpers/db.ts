import { env } from 'cloudflare:test'

// 外部キーの依存順（子 → 親）
const TABLES = [
  'expense_check_template',
  'expense',
  'income',
  'asset',
  'fund_transaction',
  'expense_category',
  'payment_method',
  'income_category',
  'asset_category',
] as const

/** 全テーブルを空にし、AUTOINCREMENTの採番もリセットする */
export async function resetDb() {
  await env.DB.batch([
    ...TABLES.map((t) => env.DB.prepare(`DELETE FROM ${t}`)),
    env.DB.prepare(`DELETE FROM sqlite_sequence`),
  ])
}

/** 1行INSERTして採番されたidを返す */
export async function insert(table: string, row: Record<string, unknown>): Promise<number> {
  const cols = Object.keys(row)
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  const res = await env.DB.prepare(sql)
    .bind(...Object.values(row))
    .run()
  return res.meta.last_row_id
}

/** 支出まわりの最小マスタ（カテゴリ・支払い方法）を投入する */
export async function seedExpenseMasters() {
  const foodId = await insert('expense_category', { name: '食費' })
  const rentId = await insert('expense_category', { name: '家賃' })
  const cashId = await insert('payment_method', { name: '現金' })
  const cardId = await insert('payment_method', { name: 'クレジットカード' })
  return { foodId, rentId, cashId, cardId }
}
