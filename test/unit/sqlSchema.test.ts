import { describe, expect, expectTypeOf, it } from 'vitest'
import { schema, type Row } from '@/utils/sqlSchema'

describe('Row（テーブル定義から導く行の型）', () => {
  it('基本カラム・テーブルのカラム・JOIN先のエイリアスを持つ', () => {
    expectTypeOf<Row<'expense'>>().toEqualTypeOf<{
      id: number
      created_at: string
      updated_at: string
      date: string
      amount: number
      expense_category_id: number
      payment_method_id: number
      description: string | null
      category_name: string
      payment_method_name: string
    }>()
  })

  it('JOINが無いテーブルは基本カラムとテーブルのカラムだけ', () => {
    expectTypeOf<Row<'payment_method'>>().toEqualTypeOf<{
      id: number
      created_at: string
      updated_at: string
      name: string
    }>()
  })

  it('LEFT JOIN先は null になりうる', () => {
    expectTypeOf<Row<'expense_check_template'>['payment_method_name']>().toEqualTypeOf<
      string | null
    >()
    expectTypeOf<Row<'expense_check_template'>['payment_method_id']>().toEqualTypeOf<
      number | null
    >()
  })

  it('ユニオンを渡すとテーブルごとの行のユニオン', () => {
    expectTypeOf<Row<'income' | 'fund_transaction'>>().toEqualTypeOf<
      Row<'income'> | Row<'fund_transaction'>
    >()
  })
})

describe('schema（SQL生成用の定義）', () => {
  it('fields は id・カラム・created_at・updated_at の順', () => {
    expect(schema.income.fields).toEqual([
      'id',
      'date',
      'amount',
      'income_category_id',
      'description',
      'created_at',
      'updated_at',
    ])
  })

  it('INSERT・UPDATE するのはテーブルのカラムだけ', () => {
    expect(schema.asset_category.writableFields).toEqual(['name', 'is_investment'])
  })

  it('JOIN先は "式 AS エイリアス" にし、LEFT 指定だけ type を持つ', () => {
    expect(schema.expense_check_template.joinFields).toEqual([
      'expense_category.name AS category_name',
      'payment_method.name AS payment_method_name',
    ])
    expect(schema.expense_check_template.joins.map((j) => j.type)).toEqual([undefined, 'LEFT'])
  })
})
