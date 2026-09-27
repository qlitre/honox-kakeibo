import { schema, type SchemaEntry } from '@/utils/sqlSchema'

type Schema = typeof schema

export type TableName = keyof Schema

// "x.name AS category_name" → "category_name"
type Alias<S> = S extends `${string} AS ${infer A}` ? A : never
type JoinAlias<T extends TableName> = Alias<Schema[T]['joinFields'][number]>

/** テーブル自身のカラム */
type Column<T extends TableName> = Schema[T]['fields'][number]

/** WHERE に使える名前: テーブル自身のカラム、JOIN先のエイリアス、集計用の year_month */
export type FilterField<T extends TableName> = Column<T> | JoinAlias<T> | 'year_month'

const operators = {
  eq: '=',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  contains: 'LIKE',
} as const

export type Filter<T extends TableName> = {
  field: FilterField<T>
  op: keyof typeof operators
  value: string | number
}

/** GROUP BY に使える名前: year_month、カテゴリID（category_id）、JOIN先のエイリアス */
export type SummaryKey<T extends TableName> = 'year_month' | 'category_id' | JoinAlias<T>

// 実行時はリテラル型を広げた SchemaEntry として扱う
const entry = (tableName: TableName): SchemaEntry => schema[tableName]

const writableFields = (tableName: TableName) => [
  ...entry(tableName).requiredFields,
  ...entry(tableName).optionalFields,
]

const joinAliases = (tableName: TableName) =>
  entry(tableName)
    .joinFields.map((f) => f.split(/\s+AS\s+/i)[1])
    .filter(Boolean)

export const generateSelectQuery = (tableName: TableName) => {
  const tableConfig = entry(tableName)
  // フィールドを作成
  let fields = tableConfig.fields.map((field) => `${tableName}.${field}`).join(', ')
  const joinFields = tableConfig.joinFields.join(', ')
  if (joinFields) fields += `, ${joinFields}`

  let query = `SELECT ${fields} FROM ${tableName}`
  for (const join of tableConfig.joins) {
    const joinType = join.type === 'LEFT' ? 'LEFT JOIN' : 'JOIN'
    query += ` ${joinType} ${join.table} ON ${join.condition}`
  }
  return query
}

// 動的にINSERTクエリを生成。columns を渡すと、そのカラムだけに絞る（残りはDBの既定値）
export const generateInsertQuery = (tableName: TableName, columns?: string[]) => {
  const fields = writableFields(tableName).filter((field) => !columns || columns.includes(field))
  const placeholders = fields.map(() => '?').join(', ')
  return `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`
}

export const generateQueryBindValues = (tableName: TableName, data: Record<string, unknown>) =>
  writableFields(tableName).map((field) => data[field])

export const generateUpdateQuery = (tableName: TableName) => {
  const setClause = [...writableFields(tableName), 'updated_at']
    .map((field) => `${field} = ?`)
    .join(', ')
  return `UPDATE ${tableName} SET ${setClause} WHERE id = ?;`
}

const categoryColumn = (tableName: TableName) => {
  const column = `${tableName}_category_id`
  return entry(tableName).fields.includes(column) ? column : undefined
}

export const generateSummaryQuery = (tableName: TableName): string => {
  const schemaDefinition = entry(tableName)

  if (!schemaDefinition) {
    throw new Error(`Table ${tableName} is not defined in the schema`)
  }

  // 年月別にグループ化するためにstrftime関数を使用
  const arr = ['SUM(amount) AS total_amount', `strftime('%Y-%m', ${tableName}.date) AS year_month`]
  const category = categoryColumn(tableName)
  if (category) arr.push(`${category} AS category_id`)
  arr.push(...schemaDefinition.joinFields)

  const joins = schemaDefinition.joins
    .map((join) => `LEFT JOIN ${join.table} ON ${join.condition}`)
    .join(' ')

  return `SELECT ${arr.join(', ')} FROM ${tableName} ${joins}`.trim()
}

// LIKE の % と _ をワイルドカードではなく文字として扱う（ESCAPE '\' と組で使う）
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`)

export type WhereClause = {
  /** "WHERE ..."。条件が無ければ空文字 */
  sql: string
  /** プレースホルダ ? に順にbindする値 */
  params: (string | number)[]
}

export const buildSqlWhereClause = <T extends TableName>(
  tableName: T,
  filters: Filter<T>[] = []
): WhereClause => {
  const baseFields: readonly string[] = entry(tableName).fields
  const extraFields = new Set([...joinAliases(tableName), 'year_month'])
  const conditions: string[] = []
  const params: (string | number)[] = []

  for (const { field: name, op, value } of filters) {
    // カラム名はbindできないため、既知の名前だけを許可する（型に加えて実行時にも検査する）。
    // テーブル自身のフィールドはテーブル名を付け、JOIN先のエイリアス等はそのまま使う。
    let field: string
    if (baseFields.includes(name)) {
      field = `${tableName}.${name}`
    } else if (extraFields.has(name)) {
      field = name
    } else {
      throw new Error(`Unknown filter field for ${tableName}: ${name}`)
    }
    const operator = operators[op]
    if (!operator) throw new Error(`Unknown filter operator: ${op}`)
    // 値は必ずプレースホルダで渡す（SQL文字列に埋め込まない）
    if (op === 'contains') {
      conditions.push(`${field} ${operator} ? ESCAPE '\\'`)
      params.push(`%${escapeLike(String(value))}%`)
    } else {
      conditions.push(`${field} ${operator} ?`)
      params.push(value)
    }
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  }
}

/** "-date,expense_category_id" → "ORDER BY expense.date DESC, expense.expense_category_id ASC" */
export const buildSqlOrderByClause = (tableName: TableName, orderParams: string) => {
  const baseFields: readonly string[] = entry(tableName).fields
  const orderClauses = orderParams.split(',').map((field) => {
    const desc = field.startsWith('-')
    const column = desc ? field.slice(1) : field
    if (!baseFields.includes(column)) {
      throw new Error(`Unknown order field for ${tableName}: ${column}`)
    }
    return `${tableName}.${column} ${desc ? 'DESC' : 'ASC'}`
  })
  return `ORDER BY ${orderClauses.join(', ')}`
}

/** 集計のグループ化キー。並び順もこのキー順にする */
export const buildSqlGroupByClause = (tableName: TableName, keys: string[]) => {
  const allowed = new Set(['year_month', ...joinAliases(tableName)])
  if (categoryColumn(tableName)) allowed.add('category_id')
  for (const key of keys) {
    if (!allowed.has(key)) throw new Error(`Unknown group key for ${tableName}: ${key}`)
  }
  const list = keys.join(', ')
  return `GROUP BY ${list} ORDER BY ${list}`
}
