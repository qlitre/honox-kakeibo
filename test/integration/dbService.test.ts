import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { Expense, ExpenseCategory } from '@/@types/dbTypes'
import {
  checkMonthlyExpenses,
  createItem,
  deleteItem,
  fetchDetail,
  fetchListWithFilter,
  fetchSimpleList,
  fetchSummary,
  isForeignKeyConstraintError,
  updateItem,
} from '@/libs/dbService'
import { insert, seedExpenseMasters } from '../helpers/db'

const db = () => env.DB

const count = async (table: string) =>
  (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>())!.n

/** 支出を1件投入する（マスタIDは seedExpenseMasters の戻り値を使う） */
const insertExpense = (
  row: { date: string; amount: number; expense_category_id: number; payment_method_id: number },
  description = ''
) => insert('expense', { ...row, description })

describe('fetchListWithFilter', () => {
  it('JOIN先の名前付きで取得し、件数・ページ数を返す', async () => {
    const m = await seedExpenseMasters()
    for (let d = 1; d <= 5; d++) {
      await insertExpense({
        date: `2026-09-0${d}`,
        amount: d * 100,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
      })
    }

    const res = await fetchListWithFilter<any>({
      db: db(),
      table: 'expense',
      orders: '-date',
      limit: 2,
      offset: 2,
    })

    expect(res).toMatchObject({ totalCount: 5, limit: 2, offset: 2, pageSize: 3 })
    expect(res.contents.map((e) => e.date)).toEqual(['2026-09-03', '2026-09-02'])
    expect(res.contents[0]).toMatchObject({ category_name: '食費', payment_method_name: '現金' })
  })

  it('フィルタは一覧と件数の両方に効く', async () => {
    const m = await seedExpenseMasters()
    await insertExpense({
      date: '2026-08-31',
      amount: 1,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    await insertExpense({
      date: '2026-09-01',
      amount: 2,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    await insertExpense({
      date: '2026-09-30',
      amount: 3,
      expense_category_id: m.rentId,
      payment_method_id: m.cashId,
    })
    await insertExpense({
      date: '2026-10-01',
      amount: 4,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })

    const res = await fetchListWithFilter<any>({
      db: db(),
      table: 'expense',
      filters: 'date[greater_equal]2026-09-01[and]date[less_equal]2026-09-30',
      orders: 'date',
      limit: 30,
      offset: 0,
    })
    expect(res.totalCount).toBe(2)
    expect(res.contents.map((e) => e.amount)).toEqual([2, 3])
  })

  it('[contain] は部分一致で検索する', async () => {
    const m = await seedExpenseMasters()
    await insertExpense(
      { date: '2026-09-01', amount: 1, expense_category_id: m.foodId, payment_method_id: m.cashId },
      '駅前ランチ'
    )
    await insertExpense(
      { date: '2026-09-02', amount: 2, expense_category_id: m.foodId, payment_method_id: m.cashId },
      'スーパー'
    )

    const res = await fetchListWithFilter<any>({
      db: db(),
      table: 'expense',
      filters: 'description[contain]ランチ',
      limit: 30,
      offset: 0,
    })
    expect(res.contents.map((e) => e.description)).toEqual(['駅前ランチ'])
  })

  it('0件なら pageSize も0', async () => {
    const res = await fetchListWithFilter({ db: db(), table: 'expense', limit: 30, offset: 0 })
    expect(res).toMatchObject({ contents: [], totalCount: 0, pageSize: 0 })
  })

  it('注入を狙った文字列は、単なる検索語として扱われる', async () => {
    const m = await seedExpenseMasters()
    await insertExpense(
      { date: '2026-09-01', amount: 1, expense_category_id: m.foodId, payment_method_id: m.cashId },
      'A'
    )
    await insertExpense(
      { date: '2026-09-02', amount: 2, expense_category_id: m.foodId, payment_method_id: m.cashId },
      'B'
    )

    const res = await fetchListWithFilter({
      db: db(),
      table: 'expense',
      filters: "description[contain]存在しない' OR 1=1 OR '",
      limit: 30,
      offset: 0,
    })
    expect(res.totalCount).toBe(0)
    expect(res.contents).toEqual([])
  })

  it("検索語に ' を含んでも、その文字列として検索できる", async () => {
    const m = await seedExpenseMasters()
    await insertExpense(
      { date: '2026-09-01', amount: 1, expense_category_id: m.foodId, payment_method_id: m.cashId },
      "McDonald's"
    )

    const res = await fetchListWithFilter<any>({
      db: db(),
      table: 'expense',
      filters: "description[contain]McDonald's",
      limit: 30,
      offset: 0,
    })
    expect(res.contents.map((e) => e.description)).toEqual(["McDonald's"])
  })

  it('検索語の % や _ はワイルドカードではなく文字として一致する', async () => {
    const m = await seedExpenseMasters()
    const row = {
      date: '2026-09-01',
      amount: 1,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    }
    await insertExpense(row, '100%還元')
    await insertExpense(row, '1000円')

    const res = await fetchListWithFilter<any>({
      db: db(),
      table: 'expense',
      filters: 'description[contain]100%',
      limit: 30,
      offset: 0,
    })
    expect(res.contents.map((e) => e.description)).toEqual(['100%還元'])
  })

  it('未知のカラム名でフィルタすると例外', async () => {
    await expect(
      fetchListWithFilter({
        db: db(),
        table: 'expense',
        filters: 'no_such[eq]1',
        limit: 30,
        offset: 0,
      })
    ).rejects.toThrow('Unknown filter field')
  })
})

describe('fetchSimpleList', () => {
  it('並び順を指定して全件取得する', async () => {
    await insert('payment_method', { name: 'B' })
    await insert('payment_method', { name: 'A' })
    const res = await fetchSimpleList<{ name: string }>({
      db: db(),
      table: 'payment_method',
      orders: 'name',
    })
    expect(res.contents.map((r) => r.name)).toEqual(['A', 'B'])
    expect(res).toMatchObject({ totalCount: 2, limit: 100, offset: 0, pageSize: 1 })
  })

  it('既定の上限は100件で、totalCount は取得件数（テーブルの総数ではない）', async () => {
    await env.DB.batch(
      Array.from({ length: 101 }, (_, i) =>
        env.DB.prepare('INSERT INTO payment_method (name) VALUES (?)').bind(`pm${i}`)
      )
    )
    const res = await fetchSimpleList({ db: db(), table: 'payment_method' })
    expect(res.contents).toHaveLength(100)
    expect(res.totalCount).toBe(100)
  })
})

describe('fetchDetail', () => {
  it('JOIN先の名前付きで1件取得する', async () => {
    const m = await seedExpenseMasters()
    const id = await insertExpense({
      date: '2026-09-01',
      amount: 500,
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
    })
    const detail = await fetchDetail<Expense & { category_name: string }>({
      db: db(),
      table: 'expense',
      id,
    })
    expect(detail).toMatchObject({
      id,
      amount: 500,
      category_name: '家賃',
      payment_method_name: 'クレジットカード',
    })
  })

  it('存在しなければ null', async () => {
    expect(await fetchDetail({ db: db(), table: 'expense', id: 999 })).toBeNull()
  })

  it('id は文字列でも取得できる（ルートパラメータをそのまま渡している）', async () => {
    const id = await insert('expense_category', { name: '食費' })
    expect(
      await fetchDetail({ db: db(), table: 'expense_category', id: String(id) })
    ).toMatchObject({ id })
  })
})

describe('createItem', () => {
  it('登録して、JOIN先の名前付きの詳細を返す', async () => {
    const m = await seedExpenseMasters()
    const item = await createItem<any>({
      db: db(),
      table: 'expense',
      data: {
        date: '2026-09-01',
        amount: 1200,
        expense_category_id: m.foodId,
        payment_method_id: m.cardId,
        description: 'ランチ',
      },
    })
    expect(item).toMatchObject({
      id: expect.any(Number),
      date: '2026-09-01',
      amount: 1200,
      category_name: '食費',
      payment_method_name: 'クレジットカード',
      description: 'ランチ',
    })
    expect(await count('expense')).toBe(1)
  })

  it('スキーマ外のキーは無視される', async () => {
    const item = await createItem<any>({
      db: db(),
      table: 'payment_method',
      data: { name: '現金', id: 999, created_at: '2000-01-01' },
    })
    expect(item.id).not.toBe(999)
    expect(item.created_at).not.toBe('2000-01-01')
  })

  it('FIXME: 任意カラムを省略すると undefined をbindして失敗する（DBの既定値は使われない）', async () => {
    await expect(
      createItem({ db: db(), table: 'asset_category', data: { name: '証券口座' } })
    ).rejects.toThrow()
    expect(await count('asset_category')).toBe(0)
  })

  it('外部キー違反（存在しないカテゴリ）は例外で、行は残らない', async () => {
    const m = await seedExpenseMasters()
    await expect(
      createItem({
        db: db(),
        table: 'expense',
        data: {
          date: '2026-09-01',
          amount: 1,
          expense_category_id: 999,
          payment_method_id: m.cashId,
          description: '',
        },
      })
    ).rejects.toThrow(/FOREIGN KEY/)
    expect(await count('expense')).toBe(0)
  })
})

describe('updateItem', () => {
  it('全カラムを更新し、updated_at を現在時刻（UTC）にする', async () => {
    const m = await seedExpenseMasters()
    const id = await insert('expense', {
      date: '2026-09-01',
      amount: 100,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      description: 'before',
      updated_at: '2000-01-01 00:00:00',
    })

    const before = Date.now()
    const item = await updateItem<any>({
      db: db(),
      table: 'expense',
      id,
      data: {
        date: '2026-09-02',
        amount: 200,
        expense_category_id: m.rentId,
        payment_method_id: m.cardId,
        description: 'after',
      },
    })

    expect(item).toMatchObject({
      id,
      date: '2026-09-02',
      amount: 200,
      category_name: '家賃',
      description: 'after',
    })
    expect(item.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    const updatedAt = Date.parse(item.updated_at.replace(' ', 'T') + 'Z')
    expect(updatedAt).toBeGreaterThanOrEqual(Math.floor(before / 1000) * 1000)
  })

  it('他の行には影響しない', async () => {
    const a = await insert('payment_method', { name: 'A' })
    const b = await insert('payment_method', { name: 'B' })
    await updateItem({ db: db(), table: 'payment_method', id: a, data: { name: 'A2' } })
    expect(await fetchDetail({ db: db(), table: 'payment_method', id: b })).toMatchObject({
      name: 'B',
    })
  })

  it('存在しない id は例外', async () => {
    await expect(
      updateItem({ db: db(), table: 'payment_method', id: 999, data: { name: 'x' } })
    ).rejects.toThrow('Updated payment_method not found')
  })
})

describe('deleteItem', () => {
  it('1件削除する', async () => {
    const a = await insert('payment_method', { name: 'A' })
    await insert('payment_method', { name: 'B' })
    await deleteItem({ db: db(), table: 'payment_method', id: a })
    expect(await count('payment_method')).toBe(1)
    expect(await fetchDetail({ db: db(), table: 'payment_method', id: a })).toBeNull()
  })

  it('存在しない id でもエラーにならない', async () => {
    await expect(
      deleteItem({ db: db(), table: 'payment_method', id: 999 })
    ).resolves.toBeUndefined()
  })

  it('使用中のカテゴリは外部キー制約で削除できない（例外）', async () => {
    const m = await seedExpenseMasters()
    await insertExpense({
      date: '2026-09-01',
      amount: 1,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    await expect(deleteItem({ db: db(), table: 'expense_category', id: m.foodId })).rejects.toThrow(
      /FOREIGN KEY/
    )
    expect(
      await fetchDetail<ExpenseCategory>({ db: db(), table: 'expense_category', id: m.foodId })
    ).not.toBeNull()
  })
})

describe('isForeignKeyConstraintError', () => {
  it('D1の外部キー制約違反だけを true と判定する', async () => {
    const m = await seedExpenseMasters()
    await insertExpense({
      date: '2026-09-01',
      amount: 1,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    const fkError = await deleteItem({ db: db(), table: 'expense_category', id: m.foodId }).catch(
      (e) => e
    )
    expect(isForeignKeyConstraintError(fkError)).toBe(true)

    const syntaxError = await env.DB.prepare('SELEC 1')
      .run()
      .catch((e) => e)
    expect(isForeignKeyConstraintError(syntaxError)).toBe(false)
    expect(isForeignKeyConstraintError('FOREIGN KEY constraint failed')).toBe(false)
  })
})

describe('fetchSummary', () => {
  it('年月・カテゴリ別の合計（月間収支ダッシュボードと同じ呼び方）', async () => {
    const m = await seedExpenseMasters()
    await insertExpense({
      date: '2026-08-31',
      amount: 999,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    await insertExpense({
      date: '2026-09-01',
      amount: 100,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
    })
    await insertExpense({
      date: '2026-09-15',
      amount: 250,
      expense_category_id: m.foodId,
      payment_method_id: m.cardId,
    })
    await insertExpense({
      date: '2026-09-30',
      amount: 80000,
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
    })
    await insertExpense({
      date: '2026-10-01',
      amount: 999,
      expense_category_id: m.rentId,
      payment_method_id: m.cashId,
    })

    const { summary } = await fetchSummary<any>({
      db: db(),
      table: 'expense',
      filters: 'year_month[eq]2026-09',
      groupBy: 'year_month, category_name',
      orderRaw: 'year_month ASC',
    })

    const byCategory = Object.fromEntries(summary.map((s) => [s.category_name, s]))
    expect(Object.keys(byCategory).sort()).toEqual(['家賃', '食費'])
    expect(byCategory['食費']).toMatchObject({
      total_amount: 350,
      year_month: '2026-09',
      category_id: m.foodId,
    })
    expect(byCategory['家賃']).toMatchObject({
      total_amount: 80000,
      year_month: '2026-09',
      category_id: m.rentId,
    })
  })

  it('年月だけでグループ化し、orders で並べる（投資サマリと同じ呼び方）', async () => {
    await insert('fund_transaction', { date: '2026-08-10', amount: 30000 })
    await insert('fund_transaction', { date: '2026-07-10', amount: 10000 })
    await insert('fund_transaction', { date: '2026-07-25', amount: 5000 })

    const { summary } = await fetchSummary<any>({
      db: db(),
      table: 'fund_transaction',
      groupBy: 'year_month',
      orders: 'date',
    })
    expect(summary).toEqual([
      { total_amount: 15000, year_month: '2026-07' },
      { total_amount: 30000, year_month: '2026-08' },
    ])
  })

  it('JOIN先のフィールドで絞り込める（投資用カテゴリのみ）', async () => {
    const invest = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    const bank = await insert('asset_category', { name: '普通預金', is_investment: 0 })
    await insert('asset', { date: '2026-09-30', amount: 1_000_000, asset_category_id: invest })
    await insert('asset', { date: '2026-09-30', amount: 500_000, asset_category_id: bank })

    const { summary } = await fetchSummary<any>({
      db: db(),
      table: 'asset',
      filters: 'is_investment[eq]1',
      groupBy: 'year_month, is_investment, category_name',
      orderRaw: 'year_month ASC',
    })
    expect(summary).toHaveLength(1)
    expect(summary[0]).toMatchObject({ total_amount: 1_000_000, category_name: '証券口座' })
  })

  it('データが無ければ空', async () => {
    const { summary } = await fetchSummary({ db: db(), table: 'income', groupBy: 'year_month' })
    expect(summary).toEqual([])
  })
})

describe('checkMonthlyExpenses（定期支払いチェック）', () => {
  const setup = async () => {
    const m = await seedExpenseMasters()
    const tpl = (name: string, pattern: string, extra: Record<string, unknown> = {}) =>
      insert('expense_check_template', {
        name,
        expense_category_id: m.rentId,
        description_pattern: pattern,
        ...extra,
      })
    return { m, tpl }
  }

  it('テンプレートごとに、対象月に一致する支出があるかを返す', async () => {
    const { m, tpl } = await setup()
    await tpl('家賃', '家賃', { payment_method_id: m.cardId })
    await tpl('駐車場', '駐車場')
    await insertExpense(
      {
        date: '2026-09-27',
        amount: 80000,
        expense_category_id: m.rentId,
        payment_method_id: m.cardId,
      },
      '9月分家賃'
    )

    const res = await checkMonthlyExpenses({ db: db(), year: '2026', month: '9' })

    expect(res.map((r) => [r.template.name, r.isRegistered])).toEqual([
      ['家賃', true],
      ['駐車場', false],
    ])
    expect(res[0].template).toMatchObject({
      category_name: '家賃',
      payment_method_name: 'クレジットカード',
    })
    expect(res[0].expense).toMatchObject({ date: '2026-09-27', amount: 80000 })
    // 支払い方法未設定のテンプレートも LEFT JOIN で取得される
    expect(res[1].template.payment_method_name).toBeNull()
    expect(res[1].expense).toBeNull()
  })

  it('別の月・別のカテゴリの支出は一致しない', async () => {
    const { m, tpl } = await setup()
    await tpl('家賃', '家賃')
    await insertExpense(
      { date: '2026-08-27', amount: 1, expense_category_id: m.rentId, payment_method_id: m.cashId },
      '家賃'
    )
    await insertExpense(
      { date: '2026-09-27', amount: 1, expense_category_id: m.foodId, payment_method_id: m.cashId },
      '家賃'
    )

    const [r] = await checkMonthlyExpenses({ db: db(), year: '2026', month: '09' })
    expect(r.isRegistered).toBe(false)
  })

  it('複数一致する場合は日付が最新のものを返す', async () => {
    const { m, tpl } = await setup()
    await tpl('家賃', '家賃')
    await insertExpense(
      { date: '2026-09-01', amount: 1, expense_category_id: m.rentId, payment_method_id: m.cashId },
      '家賃'
    )
    await insertExpense(
      { date: '2026-09-25', amount: 2, expense_category_id: m.rentId, payment_method_id: m.cashId },
      '家賃'
    )

    const [r] = await checkMonthlyExpenses({ db: db(), year: '2026', month: '9' })
    expect(r.expense).toMatchObject({ date: '2026-09-25', amount: 2 })
  })

  it('無効なテンプレートは対象外で、名前順に並ぶ', async () => {
    const { tpl } = await setup()
    await tpl('B', 'x')
    await tpl('停止中', 'x', { is_active: 0 })
    await tpl('A', 'x')

    const res = await checkMonthlyExpenses({ db: db(), year: '2026', month: '9' })
    expect(res.map((r) => r.template.name)).toEqual(['A', 'B'])
  })

  it('FIXME: パターン中の % や _ はワイルドカードとして扱われる', async () => {
    const { m, tpl } = await setup()
    await tpl('家賃', '家_')
    await insertExpense(
      { date: '2026-09-01', amount: 1, expense_category_id: m.rentId, payment_method_id: m.cashId },
      '家賃'
    )

    const [r] = await checkMonthlyExpenses({ db: db(), year: '2026', month: '9' })
    expect(r.isRegistered).toBe(true)
  })
})
