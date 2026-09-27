import { describe, expect, it, vi } from 'vitest'
import { authRequest, cookies, postForm } from '../../helpers/app'
import { count, insert, row, seedExpenseMasters } from '../../helpers/db'

// 明細系（支出・収入・資産・入金履歴）の create / update / delete / 一覧 は同じ作りなので表で回す

type Form = Record<string, string | number>
type Case = {
  endPoint: 'expense' | 'income' | 'asset' | 'fund_transaction'
  title: string
  /** マスタを投入し、登録用・更新用のフォームを返す */
  seed: () => Promise<{ form: Form; alt: Form; brokenFk?: Form }>
}

const cases: Case[] = [
  {
    endPoint: 'expense',
    title: '支出リスト',
    seed: async () => {
      const m = await seedExpenseMasters()
      const form = {
        date: '2026-09-01',
        amount: 1200,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
        description: 'ランチ',
      }
      return {
        form,
        alt: {
          date: '2026-09-02',
          amount: 3400,
          expense_category_id: m.rentId,
          payment_method_id: m.cardId,
          description: '変更後',
        },
        brokenFk: { ...form, expense_category_id: 999 },
      }
    },
  },
  {
    endPoint: 'income',
    title: '収入リスト',
    seed: async () => {
      const salary = await insert('income_category', { name: '給与' })
      const bonus = await insert('income_category', { name: '賞与' })
      const form = {
        date: '2026-09-25',
        amount: 300000,
        income_category_id: salary,
        description: '9月分',
      }
      return {
        form,
        alt: {
          date: '2026-09-26',
          amount: 500000,
          income_category_id: bonus,
          description: '変更後',
        },
        brokenFk: { ...form, income_category_id: 999 },
      }
    },
  },
  {
    endPoint: 'asset',
    title: '資産リスト',
    seed: async () => {
      const bank = await insert('asset_category', { name: '普通預金' })
      const stock = await insert('asset_category', { name: '証券口座', is_investment: 1 })
      const form = {
        date: '2026-09-30',
        amount: 1000000,
        asset_category_id: bank,
        description: '月末残高',
      }
      return {
        form,
        alt: {
          date: '2026-10-31',
          amount: 1200000,
          asset_category_id: stock,
          description: '変更後',
        },
        brokenFk: { ...form, asset_category_id: 999 },
      }
    },
  },
  {
    endPoint: 'fund_transaction',
    title: '投資用口座入金履歴',
    seed: async () => ({
      form: { date: '2026-09-10', amount: 30000, description: 'つみたて' },
      alt: { date: '2026-09-11', amount: 50000, description: '変更後' },
    }),
  },
]

/** フォーム値を、DBに保存されるはずの値（数値カラムは number）に変換する */
const asStored = (form: Form) =>
  Object.fromEntries(
    Object.entries(form).map(([k, v]) => [k, k === 'amount' || k.endsWith('_id') ? Number(v) : v])
  )

describe.each(cases)('$endPoint', ({ endPoint, title, seed }) => {
  const base = `/auth/${endPoint}`

  describe('POST create', () => {
    it('登録して一覧へ303。lastUpdate に新しいid、成功Cookie、Slack通知', async () => {
      const { form } = await seed()
      const res = await postForm(`${base}/create`, form)

      expect(res.status).toBe(303)
      const id = Number(
        res.headers.get('Location')!.match(new RegExp(`^${base}\\?lastUpdate=(\\d+)$`))![1]
      )
      expect(await row(endPoint, id)).toMatchObject(asStored(form))
      expect(cookies(res).successMessage).toContain('成功')

      expect(fetch).toHaveBeenCalledTimes(1)
      const [, init] = vi.mocked(fetch).mock.calls[0]
      expect(JSON.parse(init!.body as string).text).toContain(`金額: ${form.amount}`)
    })

    it.each([
      ['日付が10文字でない', { date: '2026-9-1' }],
      ['金額が小数', { amount: '12.5' }],
      ['金額が負', { amount: '-1' }],
      ['金額が空', { amount: '' }],
    ])('入力エラー（%s）は一覧へ303で、登録も通知もしない', async (_, override) => {
      const { form } = await seed()
      const res = await postForm(`${base}/create`, { ...form, ...override })
      expect(res.status).toBe(303)
      expect(res.headers.get('Location')).toBe(base)
      expect(await count(endPoint)).toBe(0)
      expect(fetch).not.toHaveBeenCalled()
    })

    it.skipIf(endPoint === 'fund_transaction')(
      '存在しないカテゴリ等（DBエラー）は500のJSON',
      async () => {
        const { brokenFk } = await seed()
        const res = await postForm(`${base}/create`, brokenFk!)
        expect(res.status).toBe(500)
        expect(await res.json()).toEqual({ error: `Failed to add ${endPoint}` })
        expect(await count(endPoint)).toBe(0)
      }
    )
  })

  describe('POST [id]/update', () => {
    it('更新して、元のクエリ（ページ・検索条件）を引き継いで一覧へ303', async () => {
      const { form, alt } = await seed()
      const id = await insert(endPoint, asStored(form))

      const res = await postForm(`${base}/${id}/update?page=2&month=2026-09`, alt)

      expect(res.status).toBe(303)
      expect(res.headers.get('Location')).toBe(`${base}?lastUpdate=${id}&page=2&month=2026-09`)
      expect(await row(endPoint, id)).toMatchObject(asStored(alt))
      expect(cookies(res).successMessage).toContain('成功')
    })

    it('クエリが無いと末尾に & が付く（現状の挙動）', async () => {
      const { form, alt } = await seed()
      const id = await insert(endPoint, asStored(form))
      const res = await postForm(`${base}/${id}/update`, alt)
      expect(res.headers.get('Location')).toBe(`${base}?lastUpdate=${id}&`)
    })

    it('入力エラーは一覧へ303で、更新しない', async () => {
      const { form, alt } = await seed()
      const id = await insert(endPoint, asStored(form))
      const res = await postForm(`${base}/${id}/update`, { ...alt, amount: 'abc' })
      expect(res.status).toBe(303)
      expect(res.headers.get('Location')).toBe(base)
      expect(await row(endPoint, id)).toMatchObject(asStored(form))
    })

    it('存在しないidは500のJSON', async () => {
      const { alt } = await seed()
      const res = await postForm(`${base}/999/update`, alt)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: `Failed to update ${endPoint}` })
    })
  })

  describe('POST [id]/delete', () => {
    it('削除して、元のクエリを引き継いで一覧へ303', async () => {
      const { form } = await seed()
      const id = await insert(endPoint, asStored(form))
      const res = await postForm(`${base}/${id}/delete?page=2`, {})
      expect(res.status).toBe(303)
      expect(res.headers.get('Location')).toBe(`${base}?page=2`)
      expect(await count(endPoint)).toBe(0)
      expect(cookies(res).successMessage).toContain('成功')
    })
  })

  describe('GET 一覧', () => {
    it('登録済みの明細を表示し、lastUpdate の行を強調する', async () => {
      const { form } = await seed()
      const id = await insert(endPoint, asStored(form))
      const res = await authRequest(`${base}?lastUpdate=${id}`)
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain(`<title>${title}</title>`)
      expect(html).toContain(String(form.description))
      expect(html).toContain(`${Number(form.amount).toLocaleString()} 円`)
      expect(html).toContain('bg-green-100')
    })

    it('成功Cookieがあればアラートを表示する', async () => {
      await seed()
      const res = await authRequest(base, {
        headers: { Cookie: `successMessage=${encodeURIComponent('保存しました')}` },
      })
      expect(await res.text()).toContain('保存しました')
    })
  })
})

describe('支出一覧の検索・ページング', () => {
  const setup = async () => {
    const m = await seedExpenseMasters()
    await insert('expense', {
      date: '2026-08-31',
      amount: 1,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      description: '8月のランチ',
    })
    await insert('expense', {
      date: '2026-09-01',
      amount: 2,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      description: '9月のランチ',
    })
    await insert('expense', {
      date: '2026-09-02',
      amount: 3,
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
      description: '9月の家賃',
    })
    return m
  }

  it('月・カテゴリ・支払い方法・キーワードで絞り込める', async () => {
    const m = await setup()
    const html = await (
      await authRequest(
        `/auth/expense?month=2026-09&categoryId=${m.foodId}&paymentMethodId=${m.cashId}&keyword=ランチ`
      )
    ).text()
    expect(html).toContain('9月のランチ')
    expect(html).not.toContain('8月のランチ')
    expect(html).not.toContain('9月の家賃')
  })

  it('検索フォームに検索条件が残る', async () => {
    const m = await setup()
    const html = await (
      await authRequest(
        `/auth/expense?month=2026-09&categoryId=${m.foodId}&paymentMethodId=${m.cashId}&keyword=ランチ`
      )
    ).text()
    const input = (name: string) => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0]
    const selected = (name: string) =>
      html
        .match(new RegExp(`<select[^>]*name="${name}"[\\s\\S]*?</select>`))?.[0]
        .match(/<option value="(\d+)" selected="">/)?.[1]
    expect(input('month')).toMatch(/\svalue="2026-09"/)
    expect(input('keyword')).toMatch(/\svalue="ランチ"/)
    expect(selected('categoryId')).toBe(String(m.foodId))
    expect(selected('paymentMethodId')).toBe(String(m.cashId))
  })

  it('30件ごとにページを分ける', async () => {
    const m = await seedExpenseMasters()
    for (let i = 1; i <= 31; i++) {
      const day = String(Math.min(i, 28)).padStart(2, '0')
      await insert('expense', {
        date: `2026-09-${day}`,
        amount: i,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
        description: `明細${i}`,
      })
    }
    const page2 = await (await authRequest('/auth/expense?page=2')).text()
    // 日付の降順なので、2ページ目は最も古い1件だけ
    expect(page2).toContain('明細1<')
    expect(page2).not.toContain('明細31<')
  })

  it("キーワードに ' を含んでも検索できる", async () => {
    const m = await setup()
    await insert('expense', {
      date: '2026-09-03',
      amount: 4,
      expense_category_id: m.foodId,
      payment_method_id: m.cashId,
      description: "McDonald's",
    })
    const res = await authRequest(`/auth/expense?keyword=${encodeURIComponent("McDonald's")}`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('McDonald&#39;s')
    expect(html).not.toContain('9月のランチ')
  })

  it('キーワードでSQLを注入しても、フィルタは無効化されない', async () => {
    await setup()
    const html = await (
      await authRequest(`/auth/expense?keyword=${encodeURIComponent("x' OR 1=1 OR '")}`)
    ).text()
    expect(html).not.toContain('9月のランチ')
    expect(html).not.toContain('8月のランチ')
  })
})

describe('資産の重複チェック（同月・同カテゴリは1件まで）', () => {
  const setup = async () => {
    const bank = await insert('asset_category', { name: '普通預金' })
    const stock = await insert('asset_category', { name: '証券口座' })
    const bankSep = await insert('asset', {
      date: '2026-09-30',
      amount: 100,
      asset_category_id: bank,
      description: '',
    })
    return { bank, stock, bankSep }
  }

  it('登録: 同月・同カテゴリがあれば失敗Cookieで一覧へ戻し、登録しない', async () => {
    const { bank } = await setup()
    const res = await postForm('/auth/asset/create', {
      date: '2026-09-01',
      amount: 1,
      asset_category_id: bank,
      description: '',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/auth/asset')
    expect(cookies(res).dangerMessage).toContain('同月に同カテゴリの資産が登録されています')
    expect(await count('asset')).toBe(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('更新: カテゴリを変えて重複する場合は失敗し、更新しない', async () => {
    const { stock, bank } = await setup()
    const stockSep = await insert('asset', {
      date: '2026-09-30',
      amount: 200,
      asset_category_id: stock,
      description: '',
    })
    const res = await postForm(`/auth/asset/${stockSep}/update`, {
      date: '2026-09-30',
      amount: 200,
      asset_category_id: bank,
      description: '',
    })
    expect(cookies(res).dangerMessage).toContain('資産編集に失敗しました')
    expect(await row('asset', stockSep)).toMatchObject({ asset_category_id: stock })
  })

  it('更新: カテゴリを変えずに金額だけ直すのは重複扱いにならない', async () => {
    const { bank, bankSep } = await setup()
    const res = await postForm(`/auth/asset/${bankSep}/update`, {
      date: '2026-09-30',
      amount: 999,
      asset_category_id: bank,
      description: '',
    })
    expect(res.headers.get('Location')).toBe(`/auth/asset?lastUpdate=${bankSep}&`)
    expect(await row('asset', bankSep)).toMatchObject({ amount: 999 })
  })

  it('更新: カテゴリを変えずに日付だけ移して重複する場合も失敗し、更新しない', async () => {
    const { bank } = await setup()
    const bankOct = await insert('asset', {
      date: '2026-10-31',
      amount: 100,
      asset_category_id: bank,
      description: '',
    })
    const res = await postForm(`/auth/asset/${bankOct}/update`, {
      date: '2026-09-15',
      amount: 100,
      asset_category_id: bank,
      description: '',
    })
    expect(cookies(res).dangerMessage).toContain('資産編集に失敗しました')
    expect(await row('asset', bankOct)).toMatchObject({ date: '2026-10-31' })
  })

  it('更新: 空いている月へ移すのは成功する', async () => {
    const { bank, bankSep } = await setup()
    const res = await postForm(`/auth/asset/${bankSep}/update`, {
      date: '2026-11-30',
      amount: 100,
      asset_category_id: bank,
      description: '',
    })
    expect(res.headers.get('Location')).toBe(`/auth/asset?lastUpdate=${bankSep}&`)
    expect(await row('asset', bankSep)).toMatchObject({ date: '2026-11-30' })
  })
})
