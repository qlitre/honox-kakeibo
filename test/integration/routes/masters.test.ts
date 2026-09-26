import { describe, expect, it } from 'vitest'
import { authRequest, cookies, postForm } from '../../helpers/app'
import { count, insert, row, seedExpenseMasters } from '../../helpers/db'

// マスタ系（カテゴリ・支払い方法）の画面は同じ作りなので表で回す

type Case = {
  endPoint: 'expense_category' | 'income_category' | 'payment_method' | 'asset_category'
  /** このマスタを参照する明細を1件作り、マスタのidを返す */
  seedInUse: () => Promise<number>
}

const cases: Case[] = [
  {
    endPoint: 'expense_category',
    seedInUse: async () => {
      const m = await seedExpenseMasters()
      await insert('expense', {
        date: '2026-09-01',
        amount: 1,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
        description: '',
      })
      return m.foodId
    },
  },
  {
    endPoint: 'payment_method',
    seedInUse: async () => {
      const m = await seedExpenseMasters()
      await insert('expense', {
        date: '2026-09-01',
        amount: 1,
        expense_category_id: m.foodId,
        payment_method_id: m.cashId,
        description: '',
      })
      return m.cashId
    },
  },
  {
    endPoint: 'income_category',
    seedInUse: async () => {
      const id = await insert('income_category', { name: '給与' })
      await insert('income', {
        date: '2026-09-25',
        amount: 1,
        income_category_id: id,
        description: '',
      })
      return id
    },
  },
  {
    endPoint: 'asset_category',
    seedInUse: async () => {
      const id = await insert('asset_category', { name: '普通預金' })
      await insert('asset', {
        date: '2026-09-30',
        amount: 1,
        asset_category_id: id,
        description: '',
      })
      return id
    },
  },
]

describe.each(cases)('$endPoint', ({ endPoint, seedInUse }) => {
  const base = `/auth/${endPoint}`

  it('GET 一覧に名前を表示する', async () => {
    await insert(endPoint, { name: 'マスタA' })
    const res = await authRequest(base)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('マスタA')
  })

  it('GET create でフォームを表示する', async () => {
    const res = await authRequest(`${base}/create`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain(`action="${base}/create"`)
  })

  it('POST create で登録して一覧へ303', async () => {
    const res = await postForm(`${base}/create`, { name: '新規' })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(cookies(res).successMessage).toContain('成功')
    expect(await count(endPoint)).toBe(1)
  })

  it('POST create で名前が空なら、フォームを再表示して登録しない', async () => {
    const res = await postForm(`${base}/create`, { name: '' })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain(`action="${base}/create"`)
    expect(await count(endPoint)).toBe(0)
  })

  // name 入力欄の <input ...> タグだけを取り出す（失敗時にHTML全体を出さないため）
  const nameInput = (html: string) => html.match(/<input[^>]*name="name"[^>]*>/)?.[0]

  it('FIXME: GET [id]/update の現在値が defaultValue 属性で出力され、ブラウザでは空欄になる', async () => {
    const id = await insert(endPoint, { name: '旧名' })
    const res = await authRequest(`${base}/${id}/update`)
    expect(res.status).toBe(200)
    const input = nameInput(await res.text())
    expect(input).toContain('defaultValue="旧名"')
    expect(input).not.toMatch(/\svalue=/)
  })

  it.fails('GET [id]/update で現在の値が value 属性に入る', async () => {
    const id = await insert(endPoint, { name: '旧名' })
    const input = nameInput(await (await authRequest(`${base}/${id}/update`)).text())
    expect(input).toMatch(/\svalue="旧名"/)
  })

  it('GET [id]/update・[id]/delete で存在しないidは一覧へ303', async () => {
    for (const action of ['update', 'delete']) {
      const res = await authRequest(`${base}/999/${action}`)
      expect(res.status, action).toBe(303)
      expect(res.headers.get('Location'), action).toBe(base)
    }
  })

  it('POST [id]/update で更新して一覧へ303', async () => {
    const id = await insert(endPoint, { name: '旧名' })
    const res = await postForm(`${base}/${id}/update`, { name: '新名' })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(await row(endPoint, id)).toMatchObject({ name: '新名' })
  })

  it('POST [id]/update で名前が空なら、フォームを再表示して更新しない', async () => {
    const id = await insert(endPoint, { name: '旧名' })
    const res = await postForm(`${base}/${id}/update`, { name: '' })
    expect(res.status).toBe(200)
    expect(await row(endPoint, id)).toMatchObject({ name: '旧名' })
  })

  it('GET [id]/delete で確認画面を表示する', async () => {
    const id = await insert(endPoint, { name: '消す予定' })
    const res = await authRequest(`${base}/${id}/delete`)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('消す予定')
  })

  it('POST [id]/delete で削除して一覧へ303', async () => {
    const id = await insert(endPoint, { name: '消す' })
    const res = await postForm(`${base}/${id}/delete`, {})
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(await count(endPoint)).toBe(0)
  })

  it('FIXME: 明細から使われていると外部キー制約で500エラー画面になる', async () => {
    const id = await seedInUse()
    const res = await postForm(`${base}/${id}/delete`, {})
    expect(res.status).toBe(500)
    expect(await res.text()).toContain('Internal Server Error')
    expect(await row(endPoint, id)).not.toBeNull()
  })

  it.fails('明細から使われている場合は、失敗メッセージ付きで一覧へ戻る', async () => {
    const id = await seedInUse()
    const res = await postForm(`${base}/${id}/delete`, {})
    expect(res.status).toBe(303)
    expect(cookies(res).dangerMessage).toBeTruthy()
  })
})

describe('asset_category の投資フラグ', () => {
  it('チェックありで1、なしで0として登録する', async () => {
    await postForm('/auth/asset_category/create', { name: '証券口座', is_investment: '1' })
    await postForm('/auth/asset_category/create', { name: '普通預金' })
    expect(await row('asset_category', 1)).toMatchObject({ name: '証券口座', is_investment: 1 })
    expect(await row('asset_category', 2)).toMatchObject({ name: '普通預金', is_investment: 0 })
  })

  const checkbox = (html: string) => html.match(/<input[^>]*name="is_investment"[^>]*>/)?.[0]

  it('FIXME: 編集画面の投資フラグが defaultChecked 属性で出力され、ブラウザでは常に未チェック', async () => {
    const id = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    const input = checkbox(await (await authRequest(`/auth/asset_category/${id}/update`)).text())
    expect(input).toContain('defaultChecked')
    expect(input).not.toMatch(/\schecked/)
  })

  it.fails('編集画面で投資用カテゴリはチェック済みで表示される', async () => {
    const id = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    const input = checkbox(await (await authRequest(`/auth/asset_category/${id}/update`)).text())
    expect(input).toMatch(/\schecked/)
  })

  it('更新でチェックを外すと0になる', async () => {
    const id = await insert('asset_category', { name: '証券口座', is_investment: 1 })
    await postForm(`/auth/asset_category/${id}/update`, { name: '証券口座' })
    expect(await row('asset_category', id)).toMatchObject({ is_investment: 0 })
  })

  it('1 以外の値は入力エラー', async () => {
    const res = await postForm('/auth/asset_category/create', { name: 'x', is_investment: 'true' })
    expect(res.status).toBe(200)
    expect(await count('asset_category')).toBe(0)
  })
})
