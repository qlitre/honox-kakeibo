import { describe, expect, it } from 'vitest'
import { schema } from '@/utils/sqlSchema'
import {
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
  it('必須 → 任意の順でカラムを並べ、同数のプレースホルダを置く', async () => {
    expect(norm(await generateInsertQuery('expense'))).toBe(
      'INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES (?, ?, ?, ?, ?)'
    )
  })

  it.each(TABLES)('%s', async (table) => {
    expect(norm(await generateInsertQuery(table))).toMatchSnapshot()
  })
})

describe('generateUpdateQuery', () => {
  it('必須・任意カラムに加えて updated_at を更新し、id で絞る', async () => {
    expect(norm(await generateUpdateQuery('expense'))).toBe(
      'UPDATE expense SET date = ?, amount = ?, expense_category_id = ?, payment_method_id = ?, description = ?, updated_at = ? WHERE id = ?;'
    )
  })

  it.each(TABLES)('%s', async (table) => {
    expect(norm(await generateUpdateQuery(table))).toMatchSnapshot()
  })
})

describe('generateQueryBindValues', () => {
  it('INSERT/UPDATEのカラム順に値を並べ、スキーマ外のキーは無視する', async () => {
    const values = await generateQueryBindValues('expense', {
      description: 'ランチ',
      amount: 1200,
      payment_method_id: 2,
      date: '2026-09-01',
      expense_category_id: 1,
      unknown_field: 'x',
    })
    expect(values).toEqual(['2026-09-01', 1200, 1, 2, 'ランチ'])
  })

  it('欠けているカラムは undefined になる（現状の挙動。D1は undefined のbindを拒否する）', async () => {
    const values = await generateQueryBindValues('expense', { date: '2026-09-01' })
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
    ['[eq]', 'amount[eq]100', 'WHERE expense.amount = 100'],
    ['[greater_than]', 'amount[greater_than]100', 'WHERE expense.amount > 100'],
    ['[less_than]', 'amount[less_than]100', 'WHERE expense.amount < 100'],
    ['[greater_equal]', 'amount[greater_equal]100', 'WHERE expense.amount >= 100'],
    ['[less_equal]', 'amount[less_equal]100', 'WHERE expense.amount <= 100'],
  ])('%s 演算子', (_, filter, expected) => {
    expect(buildSqlWhereClause('expense', filter)).toBe(expected)
  })

  it('[contain] は前後に%を付けた LIKE になる', () => {
    expect(buildSqlWhereClause('expense', 'description[contain]ランチ')).toBe(
      "WHERE expense.description LIKE '%ランチ%'"
    )
  })

  it('数値として解釈できない値はシングルクォートで囲む', () => {
    expect(buildSqlWhereClause('expense', 'date[greater_equal]2026-09-01')).toBe(
      "WHERE expense.date >= '2026-09-01'"
    )
  })

  it('[and] で複数条件を AND 結合する', () => {
    expect(
      buildSqlWhereClause(
        'expense',
        'date[greater_equal]2026-09-01[and]date[less_equal]2026-09-30[and]expense_category_id[eq]3'
      )
    ).toBe(
      "WHERE expense.date >= '2026-09-01' AND expense.date <= '2026-09-30' AND expense.expense_category_id = 3"
    )
  })

  it('テーブル自身のフィールドでなければプレフィックスを付けない（JOIN先・SELECTエイリアス用）', () => {
    expect(buildSqlWhereClause('asset', 'is_investment[eq]1')).toBe('WHERE is_investment = 1')
    expect(buildSqlWhereClause('expense', 'year_month[eq]2026-09')).toBe(
      "WHERE year_month = '2026-09'"
    )
  })

  it('未知の演算子の条件は黙って無視される', () => {
    expect(buildSqlWhereClause('expense', 'amount[like]100[and]amount[eq]1')).toBe(
      'WHERE expense.amount = 1'
    )
  })

  it('FIXME: 空文字だと不正な "WHERE " を返す（現状は呼び出し側で空判定している）', () => {
    expect(buildSqlWhereClause('expense', '')).toBe('WHERE ')
  })

  it('FIXME: 値に含まれるシングルクォートがそのままSQLに入る（SQLインジェクション）', () => {
    expect(buildSqlWhereClause('expense', "description[contain]x' OR '1'='1")).toBe(
      "WHERE expense.description LIKE '%x' OR '1'='1%'"
    )
  })

  it('FIXME: 数値扱いの値もそのまま埋め込まれる', () => {
    // isNumeric(' ') は true になるため、空白だけの値は "= " という不正なSQLになる
    expect(buildSqlWhereClause('expense', 'expense_category_id[eq] ')).toBe(
      'WHERE expense.expense_category_id =  '
    )
  })

  // あるべき挙動。リファクタリングで直ったら it.fails → it に変える
  it.fails('値はSQL文字列に埋め込まれない（プレースホルダでbindする）', () => {
    expect(buildSqlWhereClause('expense', "description[contain]x' OR '1'='1")).not.toContain(
      "OR '1'='1"
    )
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
})
