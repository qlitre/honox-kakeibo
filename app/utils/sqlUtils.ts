import { schema } from '@/utils/sqlSchema'

export type TableName = keyof typeof schema

export const generateSelectQuery = (tableName: TableName) => {
  const tableConfig = schema[tableName]
  // フィールドを作成
  let fields = tableConfig.fields.map((field) => `${tableName}.${field}`).join(', ')
  const joinFields = tableConfig.joinFields.join(', ')
  if (joinFields) fields += `, ${joinFields}`

  let query = `SELECT ${fields} FROM ${tableName}`
  if (tableConfig.joins && tableConfig.joins.length > 0) {
    tableConfig.joins.forEach((join) => {
      const joinType = join.type === 'LEFT' ? 'LEFT JOIN' : 'JOIN'
      query += ` ${joinType} ${join.table} ON ${join.condition}`
    })
  }
  return query
}

// フォームデータの動的な受け取りとバリデーション関数
export const getAndValidateFormData = async (formData: Record<any, any>, tableName: TableName) => {
  const { requiredFields, optionalFields } = schema[tableName]

  // 必須フィールドのバリデーション
  for (const field of requiredFields) {
    if (!formData[field]) {
      return { error: `${field} is required`, isValid: false }
    }
  }

  // 必須とオプションのフィールドを結合して抽出
  const extractedData: Record<string, any> = {}
  ;[...requiredFields, ...optionalFields].forEach((field) => {
    extractedData[field] = formData[field] ?? null
  })

  return { data: extractedData, isValid: true }
}

// 動的にINSERTクエリを生成。columns を渡すと、そのカラムだけに絞る（残りはDBの既定値）
export const generateInsertQuery = async (tableName: TableName, columns?: string[]) => {
  const fields = [...schema[tableName].requiredFields, ...schema[tableName].optionalFields].filter(
    (field) => !columns || columns.includes(field)
  )
  const placeholders = fields.map(() => '?').join(', ')
  const insertQuery = `
      INSERT INTO ${tableName} (${fields.join(', ')})
      VALUES (${placeholders})
    `
  return insertQuery
}

export const generateQueryBindValues = async (tableName: TableName, data: Record<string, any>) => {
  const fields = [...schema[tableName].requiredFields, ...schema[tableName].optionalFields].flat()
  const values = fields.map((field) => data[field])
  return values
}

export const generateUpdateQuery = async (tableName: TableName) => {
  const tableConfig = schema[tableName]

  const updateFields = []
  for (const field of tableConfig.requiredFields) {
    updateFields.push(field)
  }
  for (const field of tableConfig.optionalFields) {
    updateFields.push(field)
  }
  updateFields.push('updated_at')
  const setClause = updateFields.map((field) => `${field} = ?`).join(', ')

  const query = `
      UPDATE ${tableConfig.tableName}
      SET ${setClause}
      WHERE id = ?;
    `

  return query.trim()
}

export const generateSummaryQuery = (tableName: TableName): string => {
  const schemaDefinition = schema[tableName]

  if (!schemaDefinition) {
    throw new Error(`Table ${tableName} is not defined in the schema`)
  }

  // 年月別にグループ化するためにstrftime関数を使用
  const dateField = `${tableName}.date`
  const yearMonth = `strftime('%Y-%m', ${dateField}) AS year_month`
  const arr = ['SUM(amount) AS total_amount', yearMonth]
  if (schemaDefinition.fields.indexOf(`${tableName}_category_id`) >= 0) {
    const categoryId = `${tableName}_category_id AS category_id`
    arr.push(categoryId)
  }
  arr.push(...schemaDefinition.joinFields)
  // フィールドとJOINフィールドの取得
  const fields = arr.join(', ')
  // JOIN句の組み立て
  const joins = schemaDefinition.joins
    .map((join) => `LEFT JOIN ${join.table} ON ${join.condition}`)
    .join(' ')

  // SELECTクエリの組み立て
  const query = `
        SELECT ${fields}
        FROM ${schemaDefinition.tableName}       
        ${joins}
    `
  return query
}

// 空白だけの文字列は Number(' ') === 0 になるため数値扱いしない
function isNumeric(value: string): boolean {
  return value.trim() !== '' && !isNaN(Number(value))
}

// LIKE の % と _ をワイルドカードではなく文字として扱う（ESCAPE '\' と組で使う）
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`)

// テーブル外で WHERE に使える名前: JOIN先のエイリアス（"x.name AS category_name" の右側）と集計用の year_month
const extraFilterFields = (tableName: TableName) =>
  new Set([
    ...schema[tableName].joinFields.map((f) => f.split(/\s+AS\s+/i)[1]).filter(Boolean),
    'year_month',
  ])

export type WhereClause = {
  /** "WHERE ..."。条件が無ければ空文字 */
  sql: string
  /** プレースホルダ ? に順にbindする値 */
  params: (string | number)[]
}

export const buildSqlWhereClause = (tableName: TableName, filterString: string): WhereClause => {
  const conditions: string[] = [] // SQL 条件句を格納する配列
  const params: (string | number)[] = []
  const operators: Record<string, string> = {
    '[greater_than]': '>',
    '[less_than]': '<',
    '[greater_equal]': '>=',
    '[less_equal]': '<=',
    '[eq]': '=',
    '[contain]': 'LIKE',
  }
  const baseFields = schema[tableName].fields
  const extraFields = extraFilterFields(tableName)
  if (filterString) {
    // date[greater_equal]2024-11-01[and]date[less_equal]2024-11-30
    // のようなフィルター文字列を動的に解析する
    for (const condition of filterString.split('[and]')) {
      for (const operatorKey in operators) {
        if (condition.includes(operatorKey)) {
          const [fieldName, value] = condition.split(operatorKey)
          // カラム名はbindできないため、既知の名前だけを許可する。
          // テーブル自身のフィールドはテーブル名を付け、JOIN先のエイリアス等はそのまま使う。
          let field: string
          if (baseFields.includes(fieldName)) {
            field = `${tableName}.${fieldName}`
          } else if (extraFields.has(fieldName)) {
            field = fieldName
          } else {
            throw new Error(`Unknown filter field for ${tableName}: ${fieldName}`)
          }
          const operator = operators[operatorKey]
          // 値は必ずプレースホルダで渡す（SQL文字列に埋め込まない）
          if (operatorKey === '[contain]') {
            conditions.push(`${field} ${operator} ? ESCAPE '\\'`)
            params.push(`%${escapeLike(value)}%`)
          } else {
            conditions.push(`${field} ${operator} ?`)
            params.push(isNumeric(value) ? Number(value) : value)
          }
        }
      }
    }
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  }
}

export const buildSqlOrderByClause = (tableName: TableName, orderParams: string) => {
  const fieldsArray = orderParams.split(',')
  const orderClauses = []

  for (const field of fieldsArray) {
    let sortOrder = ''
    let columnName = ''

    if (field[0] === '-') {
      sortOrder = 'DESC'
      columnName = tableName + '.' + field.slice(1)
    } else {
      sortOrder = 'ASC'
      columnName = tableName + '.' + field
    }
    orderClauses.push(`${columnName} ${sortOrder}`)
  }
  return `ORDER BY ${orderClauses.join(', ')}`
}
