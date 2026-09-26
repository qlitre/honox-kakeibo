import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { annualStartMonth, colorSchema, kakeiboMenu } from '@/settings/kakeiboSettings'

const dashboardHref = (name: string) =>
  kakeiboMenu().ダッシュボード.find((item) => item.name === name)!.href

describe('kakeiboMenu', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('月別ダッシュボードのリンクに現在の年月が入る', () => {
    vi.setSystemTime(new Date('2026-09-15T03:00:00Z'))
    expect(dashboardHref('資産ダッシュボード')).toBe('/auth/dashboard/2026/9/asset')
    expect(dashboardHref('月間収支')).toBe('/auth/dashboard/2026/9/monthly_balance')
    expect(dashboardHref('支出カレンダー')).toBe('/auth/dashboard/2026/9/expense_calendar')
  })

  it('FIXME: 年月はUTC基準のため、JSTの月初0〜9時は前月を指す', () => {
    vi.setSystemTime(new Date('2026-09-30T16:00:00Z')) // JST 10/1 01:00
    expect(dashboardHref('月間収支')).toBe('/auth/dashboard/2026/9/monthly_balance')
  })

  // あるべき挙動。直ったら it.fails → it に変える
  it.fails('年月は日本時間で決まる', () => {
    vi.setSystemTime(new Date('2026-09-30T16:00:00Z')) // JST 10/1 01:00
    expect(dashboardHref('月間収支')).toBe('/auth/dashboard/2026/10/monthly_balance')
  })

  it('全リンクが /auth 配下を指す', () => {
    const hrefs = Object.values(kakeiboMenu()).flatMap((items) => items.map((i) => i.href))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(href).toMatch(/^\/auth\//)
  })
})

describe('設定値', () => {
  it('年度開始月は1〜12', () => {
    expect(annualStartMonth).toBeGreaterThanOrEqual(1)
    expect(annualStartMonth).toBeLessThanOrEqual(12)
  })

  it('グラフ色は20色（カテゴリがこれを超えると色が undefined になる）', () => {
    expect(colorSchema).toHaveLength(20)
  })
})
