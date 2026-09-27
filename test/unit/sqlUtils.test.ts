import { describe, expect, it } from 'vitest'
import { schema } from '@/utils/sqlSchema'
import {
  buildSqlGroupByClause,
  buildSqlOrderByClause,
  buildSqlWhereClause,
  generateInsertQuery,
  generateQueryBindValues,
  generateSelectQuery,
  generateSummaryQuery,
  generateUpdateQuery,
  type TableName,
} from '@/utils/sqlUtils'

// 生成SQLの改行・インデントの差異を無視して比較する
const norm = (sql: string) => sql.replace(/\s+/g, ' ').trim()

const TABLES = Object.keys(schema) as TableName[]

describe('generateSelectQuery', () => {
  it('JOIN先のフィールドをエイリアス付きで含める', () => {
    expect(generateSelectQuery('expense')).toBe(
      'SELECT expense.id, expense.date, expense.amount, expense.expense_category_id, expense.payment_method_id, expense.description, expense.created_at, expense.updated_at, expense_category.name AS category_name, payment_method.name AS payment_method_name FROM expense JOIN expense_category ON expense.expense_category_id = expense_category.id JOIN payment_method ON expense.payment_method_id = payment_method.id'
    )
  })

  it('JOINが無いテーブルは単純なSELECT', () => {
    expect(generateSelectQuery('payment_method')).toBe(
      'SELECT payment_method.id, payment_method.name, payment_method.created_at, payment_method.updated_at FROM payment_method'
    )
  })

  it('type: LEFT のJOINだけ LEFT JOIN になる（支払い方法未設定のテンプレートも取得するため）', () => {
    const sql = generateSelectQuery('expense_check_template')
    expect(sql).toContain(' JOIN expense_category ON')
    expect(sql).not.toContain('LEFT JOIN expense_category')
    expect(sql).toContain(' LEFT JOIN payment_method ON')
  })

  it.each(TABLES)('%s', (table) => {
    expect(generateSelectQuery(table)).toMatchSnapshot()
  })
})

describe('generateInsertQuery', () => {
  it('columns を渡すとそのカラムだけ INSERT する（順序はスキーマ順）', () => {
    expect(generateInsertQuery('asset_category', ['name'])).toBe(
      'INSERT INTO asset_category (name) VALUES (?)'
    )
  })

  it('必須 → 任意の順でカラムを並べ、同数のプレースホルダを置く', () => {
    expect(norm(generateInsertQuery('expense'))).toBe(
      'INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES (?, ?, ?, ?, ?)'
    )
  })

  it.each(TABLES)('%s', (table) => {
    expect(norm(generateInsertQuery(table))).toMatchSnapshot()
  })
})

describe('generateUpdateQuery', () => {
  it('必須・任意カラムに加えて updated_at を更新し、id で絞る', () => {
    expect(norm(generateUpdateQuery('expense'))).toBe(
      'UPDATE expense SET date = ?, amount = ?, expense_category_id = ?, payment_method_id = ?, description = ?, updated_at = ? WHERE id = ?;'
    )
  })

  it.each(TABLES)('%s', (table) => {
    expect(norm(generateUpdateQuery(table))).toMatchSnapshot()
  })
})

describe('generateQueryBindValues', () => {
  it('INSERT/UPDATEのカラム順に値を並べ、スキーマ外のキーは無視する', () => {
    const values = generateQueryBindValues('expense', {
      description: 'ランチ',
      amount: 1200,
      payment_method_id: 2,
      date: '2026-09-01',
      expense_category_id: 1,
      unknown_field: 'x',
    })
    expect(values).toEqual(['2026-09-01', 1200, 1, 2, 'ランチ'])
  })

  it('欠けているカラムは undefined になる（createItem はそのカラムを INSERT から外す）', () => {
    const values = generateQueryBindValues('expense', { date: '2026-09-01' })
    expect(values).toEqual(['2026-09-01', undefined, undefined, undefined, undefined])
  })
})

describe('generateSummaryQuery', () => {
  it('年月ごとの合計と、カテゴリIDをcategory_idとして返す', () => {
    expect(norm(generateSummaryQuery('expense'))).toBe(
      "SELECT SUM(amount) AS total_amount, strftime('%Y-%m', expense.date) AS year_month, expense_category_id AS category_id, expense_category.name AS category_name, payment_method.name AS payment_method_name FROM expense LEFT JOIN expense_category ON expense.expense_category_id = expense_category.id LEFT JOIN payment_method ON expense.payment_method_id = payment_method.id"
    )
  })

  it('カテゴリを持たないテーブルは category_id を含まない', () => {
    expect(norm(generateSummaryQuery('fund_transaction'))).toBe(
      "SELECT SUM(amount) AS total_amount, strftime('%Y-%m', fund_transaction.date) AS year_month FROM fund_transaction"
    )
  })

  it('JOINはスキーマの type に関係なく常に LEFT JOIN', () => {
    expect(generateSummaryQuery('income')).toContain('LEFT JOIN income_category ON')
  })

  it('スキーマに無いテーブルは例外', () => {
    expect(() => generateSummaryQuery('no_such_table' as TableName)).toThrow(
      'Table no_such_table is not defined in the schema'
    )
  })
})

describe('buildSqlWhereClause', () => {
  it.each([
    ['eq', 'WHERE expense.amount = ?'],
    ['gt', 'WHERE expense.amount > ?'],
    ['lt', 'WHERE expense.amount < ?'],
    ['gte', 'WHERE expense.amount >= ?'],
    ['lte', 'WHERE expense.amount <= ?'],
  ] as const)('%s 演算子', (op, sql) => {
    expect(buildSqlWhereClause('expense', [{ field: 'amount', op, value: 100 }])).toEqual({
      sql,
      params: [100],
    })
  })

  it('contains は前後に%を付けた値で LIKE する', () => {
    expect(
      buildSqlWhereClause('expense', [{ field: 'description', op: 'contains', value: 'ランチ' }])
    ).toEqual({
      sql: "WHERE expense.description LIKE ? ESCAPE '\\'",
      params: ['%ランチ%'],
    })
  })

  it('contains の値に含まれる % _ \\ はエスケープして文字として検索する', () => {
    expect(
      buildSqlWhereClause('expense', [
        { field: 'description', op: 'contains', value: '100%_OFF\\' },
      ]).params
    ).toEqual(['%100\\%\\_OFF\\\\%'])
  })

  it('値は渡された型のままbindする', () => {
    expect(
      buildSqlWhereClause('expense', [
        { field: 'date', op: 'gte', value: '2026-09-01' },
        { field: 'expense_category_id', op: 'eq', value: 3 },
        { field: 'payment_method_id', op: 'eq', value: '4' },
      ]).params
    ).toEqual(['2026-09-01', 3, '4'])
  })

  it('複数条件を AND 結合し、値は順にbindする', () => {
    expect(
      buildSqlWhereClause('expense', [
        { field: 'date', op: 'gte', value: '2026-09-01' },
        { field: 'date', op: 'lte', value: '2026-09-30' },
        { field: 'expense_category_id', op: 'eq', value: 3 },
      ])
    ).toEqual({
      sql: 'WHERE expense.date >= ? AND expense.date <= ? AND expense.expense_category_id = ?',
      params: ['2026-09-01', '2026-09-30', 3],
    })
  })

  it('JOIN先のエイリアスと year_month はテーブル名を付けずに使える', () => {
    expect(buildSqlWhereClause('asset', [{ field: 'is_investment', op: 'eq', value: 1 }])).toEqual({
      sql: 'WHERE is_investment = ?',
      params: [1],
    })
    expect(
      buildSqlWhereClause('expense', [{ field: 'category_name', op: 'eq', value: '食費' }]).sql
    ).toBe('WHERE category_name = ?')
    expect(
      buildSqlWhereClause('expense', [{ field: 'year_month', op: 'eq', value: '2026-09' }])
    ).toEqual({ sql: 'WHERE year_month = ?', params: ['2026-09'] })
  })

  it('未知のカラム名・演算子は例外（型をすり抜けても実行時に検査する）', () => {
    expect(() =>
      buildSqlWhereClause('expense', [{ field: 'amount = 1 OR 1' as never, op: 'eq', value: 1 }])
    ).toThrow('Unknown filter field for expense: amount = 1 OR 1')
    expect(() =>
      buildSqlWhereClause('expense', [{ field: 'is_investment' as never, op: 'eq', value: 1 }])
    ).toThrow('Unknown filter field')
    expect(() =>
      buildSqlWhereClause('expense', [{ field: 'amount', op: 'like' as never, value: 1 }])
    ).toThrow('Unknown filter operator: like')
  })

  it('条件が無ければ WHERE を付けない', () => {
    expect(buildSqlWhereClause('expense', [])).toEqual({ sql: '', params: [] })
    expect(buildSqlWhereClause('expense')).toEqual({ sql: '', params: [] })
  })

  it('値はSQL文字列に埋め込まれない（プレースホルダでbindする）', () => {
    const { sql, params } = buildSqlWhereClause('expense', [
      { field: 'description', op: 'contains', value: "x' OR '1'='1" },
    ])
    expect(sql).not.toContain("OR '1'='1")
    expect(params).toEqual(["%x' OR '1'='1%"])
  })
})

describe('buildSqlOrderByClause', () => {
  it('先頭 - で DESC、それ以外は ASC。テーブル名を付ける', () => {
    expect(buildSqlOrderByClause('expense', '-date,expense_category_id')).toBe(
      'ORDER BY expense.date DESC, expense.expense_category_id ASC'
    )
  })

  it('単一フィールド', () => {
    expect(buildSqlOrderByClause('income', 'updated_at')).toBe('ORDER BY income.updated_at ASC')
  })

  it('テーブルに無いカラムは例外', () => {
    expect(() => buildSqlOrderByClause('income', 'id; DROP TABLE income')).toThrow(
      'Unknown order field for income: id; DROP TABLE income'
    )
    expect(() => buildSqlOrderByClause('income', 'category_name')).toThrow('Unknown order field')
  })
})

describe('buildSqlGroupByClause', () => {
  it('キー順にグループ化して並べる', () => {
    expect(buildSqlGroupByClause('expense', ['year_month', 'category_name'])).toBe(
      'GROUP BY year_month, category_name ORDER BY year_month, category_name'
    )
  })

  it('category_id はカテゴリを持つテーブルだけ使える', () => {
    expect(buildSqlGroupByClause('income', ['category_id'])).toBe(
      'GROUP BY category_id ORDER BY category_id'
    )
    expect(() => buildSqlGroupByClause('fund_transaction', ['category_id'])).toThrow(
      'Unknown group key for fund_transaction: category_id'
    )
  })

  it('許可されていないキーは例外', () => {
    expect(() => buildSqlGroupByClause('expense', ['amount'])).toThrow('Unknown group key')
  })
})
