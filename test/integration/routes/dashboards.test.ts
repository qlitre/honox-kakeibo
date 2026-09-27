import { describe, expect, it } from 'vitest'
import { authRequest, chartData } from '../../helpers/app'
import { insert, seedExpenseMasters } from '../../helpers/db'

// 集計値は手計算した期待値と照合する。HTML全体のスナップショットは取らない

const html = async (path: string) => {
  const res = await authRequest(path)
  expect(res.status).toBe(200)
  return res.text()
}

/** タグを除いたテキスト（空白を詰める）。金額の並びを検証しやすくする */
const text = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('月間収支', () => {
  const setup = async () => {
    const m = await seedExpenseMasters()
    const exp = (date: string, amount: number, cat: number) =>
      insert('expense', {
        date,
        amount,
        expense_category_id: cat,
        payment_method_id: m.cashId,
        description: '',
      })
    await exp('2026-08-10', 999, m.foodId) // 前月
    await exp('2026-09-01', 100, m.foodId)
    await exp('2026-09-15', 250, m.foodId)
    await exp('2026-09-27', 80000, m.rentId)
    await exp('2026-10-01', 5, m.foodId) // 翌月（対象外）
    const salary = await insert('income_category', { name: '給与' })
    await insert('income', {
      date: '2026-09-25',
      amount: 300000,
      income_category_id: salary,
      description: '',
    })
    return m
  }

  it('収支・支出合計・収入合計', async () => {
    await setup()
    const t = text(await html('/auth/dashboard/2026/9/monthly_balance'))
    expect(t).toContain('収支 +219,650')
    expect(t).toContain('支出合計 80,350')
    expect(t).toContain('収入合計 300,000')
  })

  it('カテゴリ別の金額・前月比・割合と、合計行', async () => {
    await setup()
    const t = text(await html('/auth/dashboard/2026/9/monthly_balance'))
    // 食費: 350（前月999 → -649）、割合 350/80350
    expect(t).toContain('食費 350 -649 0.44%')
    // 家賃: 80,000（前月0 → +80,000）
    expect(t).toContain('家賃 80,000 +80,000 99.56%')
    expect(t).toContain('合計 80,350 +79,351 100.00%')
  })

  it('支出が0件の月でも NaN を表示しない', async () => {
    await seedExpenseMasters()
    expect(await html('/auth/dashboard/2026/9/monthly_balance')).not.toContain('NaN')
  })
})

describe('資産ダッシュボード', () => {
  it('総資産・前月比・年初比', async () => {
    const bank = await insert('asset_category', { name: '普通預金' })
    const stock = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    const asset = (date: string, amount: number, cat: number) =>
      insert('asset', { date, amount, asset_category_id: cat, description: '' })
    await asset('2026-01-31', 1_000_000, bank) // 年初（年度開始月=1月）
    await asset('2026-08-31', 1_200_000, bank) // 前月
    await asset('2026-09-30', 1_100_000, bank)
    await asset('2026-09-30', 400_000, stock)

    const t = text(await html('/auth/dashboard/2026/9/asset'))
    expect(t).toContain('総資産 ¥1,500,000')
    // 前月比: 1,500,000 - 1,200,000 = +300,000（+25.00%）
    expect(t).toContain('前月比 +¥300,000 +25.00%')
    // 年初比: 1,500,000 - 1,000,000 = +500,000（+50.00%）
    expect(t).toContain('年初比 +¥500,000 +50.00%')
  })

  it('データが無くても表示できる', async () => {
    await html('/auth/dashboard/2026/9/asset')
  })
})

describe('支出カレンダー', () => {
  it('日別の合計と月合計', async () => {
    const m = await seedExpenseMasters()
    const exp = (date: string, amount: number) =>
      insert('expense', {
        date,
        amount,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
        description: '',
      })
    await exp('2026-09-01', 100)
    await exp('2026-09-01', 250)
    await exp('2026-09-30', 1234)
    await exp('2026-10-01', 9999) // 翌月（対象外）

    const h = await html('/auth/dashboard/2026/9/expense_calendar')
    expect(h).toContain('¥350')
    expect(h).toContain('¥1,234')
    expect(h).toContain('¥1,584') // 月合計
    expect(h).not.toContain('9,999')
  })
})

describe('収支推移', () => {
  const setup = async () => {
    const m = await seedExpenseMasters()
    const salary = await insert('income_category', { name: '給与' })
    const bonus = await insert('income_category', { name: '賞与' })
    await insert('income', {
      date: '2026-08-25',
      amount: 300000,
      income_category_id: salary,
      description: '',
    })
    await insert('income', {
      date: '2026-09-25',
      amount: 300000,
      income_category_id: salary,
      description: '',
    })
    await insert('income', {
      date: '2026-09-25',
      amount: 500000,
      income_category_id: bonus,
      description: '',
    })
    await insert('expense', {
      date: '2026-09-01',
      amount: 1000,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      description: '',
    })
    await insert('expense', {
      date: '2026-09-27',
      amount: 80000,
      expense_category_id: m.rentId,
      payment_method_id: m.cashId,
      description: '',
    })
    return { m, salary, bonus }
  }

  /** グラフデータから {ラベル, 収入, 支出} を取り出す */
  const series = (h: string) => {
    const [d] = chartData(h)
    const byLabel = (label: string) => d.datasets.find((ds: any) => ds.label === label)?.data
    return { labels: d.labels, income: byLabel('収入'), expense: byLabel('支出') }
  }

  it('月ごとの収入・支出の合計をグラフに渡す', async () => {
    await setup()
    expect(series(await html('/auth/dashboard/balance_transition'))).toEqual({
      labels: ['2026-08', '2026-09'],
      income: [300000, 800000],
      expense: [0, 81000],
    })
  })

  it('カテゴリで絞り込める', async () => {
    const { m, bonus } = await setup()
    const s = series(
      await html(
        `/auth/dashboard/balance_transition?income_category=${bonus}&expense_category=${m.rentId}`
      )
    )
    expect(s.income).toEqual([0, 500000])
    expect(s.expense).toEqual([0, 80000])
  })
})

describe('投資サマリ', () => {
  it('保有価額・累積投資額・利益・利益率', async () => {
    const stock = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    const bank = await insert('asset_category', { name: '普通預金', is_investment: 0 })
    await insert('asset', {
      date: '2026-08-31',
      amount: 105_000,
      asset_category_id: stock,
      description: '',
    })
    await insert('asset', {
      date: '2026-09-30',
      amount: 220_000,
      asset_category_id: stock,
      description: '',
    })
    await insert('asset', {
      date: '2026-09-30',
      amount: 9_999_999,
      asset_category_id: bank,
      description: '',
    }) // 投資用でない
    // 入金はその翌月の投資額として計上される
    await insert('fund_transaction', { date: '2026-07-10', amount: 100_000, description: '' })
    await insert('fund_transaction', { date: '2026-08-10', amount: 100_000, description: '' })

    const t = text(await html('/auth/dashboard/investment_summary'))
    // 最新月（9月）: 保有 220,000 / 累積投資 200,000 → 利益 20,000（10.00%）
    expect(t).toContain('利益 ¥20,000')
    expect(t).toContain('利益率 10.00%')
    expect(t).toContain('保有価額 ¥220,000')
    expect(t).toContain('累積投資金額 ¥200,000')
  })

  it('データが無ければ0で表示する', async () => {
    const t = text(await html('/auth/dashboard/investment_summary'))
    expect(t).toContain('利益率 0.00%')
  })
})
