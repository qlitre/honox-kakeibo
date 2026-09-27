import { z } from 'zod'

/**
 * テーブル定義。ここが唯一の正で、SQL生成（sqlUtils）と行の型（Row）はここから導く
 *
 * - columns: id・created_at・updated_at 以外のカラムと、その型（INSERT・UPDATE の対象）
 * - joins: SELECT 時に JOIN するテーブル。select のキーがエイリアス（WHERE・GROUP BY にも使える）
 */
type Join = {
  table: string
  condition: string
  /** 無指定は INNER JOIN */
  type?: 'LEFT'
  select: Record<string, { expr: string; type: z.ZodType }>
}

type TableDef = {
  columns: z.ZodRawShape
  joins: readonly Join[]
}

const defineTables = <const T extends Record<string, TableDef>>(tables: T) => tables

// sqliteのboolean は 0 / 1 の数値で返る
const bool = z.number()

const tables = defineTables({
  asset: {
    columns: {
      date: z.string(),
      amount: z.number(),
      asset_category_id: z.number(),
      description: z.string().nullable(),
    },
    joins: [
      {
        table: 'asset_category',
        condition: 'asset.asset_category_id = asset_category.id',
        select: {
          category_name: { expr: 'asset_category.name', type: z.string() },
          is_investment: { expr: 'asset_category.is_investment', type: bool },
        },
      },
    ],
  },
  asset_category: {
    columns: { name: z.string(), is_investment: bool },
    joins: [],
  },
  fund_transaction: {
    columns: { date: z.string(), amount: z.number(), description: z.string().nullable() },
    joins: [],
  },
  expense: {
    columns: {
      date: z.string(),
      amount: z.number(),
      expense_category_id: z.number(),
      payment_method_id: z.number(),
      description: z.string().nullable(),
    },
    joins: [
      {
        table: 'expense_category',
        condition: 'expense.expense_category_id = expense_category.id',
        select: { category_name: { expr: 'expense_category.name', type: z.string() } },
      },
      {
        table: 'payment_method',
        condition: 'expense.payment_method_id = payment_method.id',
        select: { payment_method_name: { expr: 'payment_method.name', type: z.string() } },
      },
    ],
  },
  expense_category: {
    columns: { name: z.string() },
    joins: [],
  },
  payment_method: {
    columns: { name: z.string() },
    joins: [],
  },
  income: {
    columns: {
      date: z.string(),
      amount: z.number(),
      income_category_id: z.number(),
      description: z.string().nullable(),
    },
    joins: [
      {
        table: 'income_category',
        condition: 'income.income_category_id = income_category.id',
        select: { category_name: { expr: 'income_category.name', type: z.string() } },
      },
    ],
  },
  income_category: {
    columns: { name: z.string() },
    joins: [],
  },
  expense_check_template: {
    columns: {
      name: z.string(),
      expense_category_id: z.number(),
      description_pattern: z.string(),
      is_active: bool,
      payment_method_id: z.number().nullable(),
    },
    joins: [
      {
        table: 'expense_category',
        condition: 'expense_check_template.expense_category_id = expense_category.id',
        select: { category_name: { expr: 'expense_category.name', type: z.string() } },
      },
      {
        // 支払い方法が未設定のテンプレートも取得するため LEFT
        table: 'payment_method',
        condition: 'expense_check_template.payment_method_id = payment_method.id',
        type: 'LEFT',
        select: {
          payment_method_name: { expr: 'payment_method.name', type: z.string().nullable() },
        },
      },
    ],
  },
})

type Tables = typeof tables
export type TableName = keyof Tables

/* ---------- 型の導出 ---------- */

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (
  x: infer I
) => void
  ? I
  : never
type Prettify<T> = { [K in keyof T]: T[K] } & {}

type JoinOf<N extends TableName> = Tables[N]['joins'][number]

/** JOIN先のエイリアス（例: category_name） */
export type JoinAlias<N extends TableName> =
  JoinOf<N> extends infer J ? (J extends { select: infer S } ? keyof S & string : never) : never

/** テーブル自身のカラム（id・created_at・updated_at を含む） */
export type Column<N extends TableName> =
  'id' | 'created_at' | 'updated_at' | (keyof Tables[N]['columns'] & string)

type JoinRow<N extends TableName> = UnionToIntersection<
  JoinOf<N> extends infer J
    ? J extends { select: infer S }
      ? {
          -readonly [K in keyof S]: S[K] extends { type: infer Z extends z.ZodType }
            ? z.output<Z>
            : never
        }
      : never
    : never
>

/** SELECT した行の型（JOIN先のエイリアス込み）。N がユニオンならテーブルごとの行のユニオン */
export type Row<N extends TableName> = N extends TableName
  ? Prettify<
      { id: number; created_at: string; updated_at: string } & z.output<
        z.ZodObject<Tables[N]['columns']>
      > &
        JoinRow<N>
    >
  : never

/* ---------- SQL生成用の実行時の定義 ---------- */

export type SchemaEntry = {
  tableName: string
  /** テーブル自身のカラム（SELECT の順） */
  fields: string[]
  /** INSERT・UPDATE するカラム */
  writableFields: string[]
  /** "テーブル.カラム AS エイリアス" */
  joinFields: string[]
  joins: { table: string; condition: string; type?: 'LEFT' }[]
}

export const schema = Object.fromEntries(
  Object.entries(tables).map(([tableName, def]) => {
    const writableFields = Object.keys(def.columns)
    const entry: SchemaEntry = {
      tableName,
      fields: ['id', ...writableFields, 'created_at', 'updated_at'],
      writableFields,
      joinFields: def.joins.flatMap((join) =>
        Object.entries(join.select).map(([alias, { expr }]) => `${expr} AS ${alias}`)
      ),
      joins: def.joins.map(({ table, condition, ...rest }) => ({
        table,
        condition,
        ...('type' in rest ? { type: rest.type } : {}),
      })),
    }
    return [tableName, entry]
  })
) as Record<TableName, SchemaEntry>
