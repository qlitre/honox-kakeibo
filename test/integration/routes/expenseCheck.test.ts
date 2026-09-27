import { describe, expect, it, vi } from 'vitest'
import { authRequest, cookies, postForm } from '../../helpers/app'
import { count, insert, row, seedExpenseMasters } from '../../helpers/db'

const insertTemplate = (m: { rentId: number }, extra: Record<string, unknown> = {}) =>
  insert('expense_check_template', {
    name: '家賃',
    expense_category_id: m.rentId,
    description_pattern: '家賃',
    ...extra,
  })

describe('チェックテンプレート', () => {
  const base = '/auth/expense_check_template'

  it('GET 一覧にテンプレートを表示する（支払い方法未設定は -）', async () => {
    const m = await seedExpenseMasters()
    await insertTemplate(m)
    const html = await (await authRequest(base)).text()
    expect(html).toContain('家賃')
    expect(html).toMatch(/>\s*-\s*</)
  })

  it('GET create でフォームを表示する', async () => {
    const res = await authRequest(`${base}/create`)
    expect(res.status).toBe(200)
  })

  it('POST create: 支払い方法が空なら null、有効チェックありで1', async () => {
    const m = await seedExpenseMasters()
    const res = await postForm(`${base}/create`, {
      name: '家賃',
      expense_category_id: m.rentId,
      payment_method_id: '',
      description_pattern: '家賃',
      is_active: '1',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(await row('expense_check_template', 1)).toMatchObject({
      payment_method_id: null,
      is_active: 1,
    })
  })

  it('POST create: 有効チェックなしで0', async () => {
    const m = await seedExpenseMasters()
    await postForm(`${base}/create`, {
      name: '家賃',
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
      description_pattern: '家賃',
    })
    expect(await row('expense_check_template', 1)).toMatchObject({
      payment_method_id: m.cardId,
      is_active: 0,
    })
  })

  it('POST create: 必須項目が空ならフォームを再表示して登録しない', async () => {
    await seedExpenseMasters()
    const res = await postForm(`${base}/create`, {
      name: '',
      expense_category_id: '',
      description_pattern: '',
    })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('名前は必須です')
    expect(await count('expense_check_template')).toBe(0)
  })

  it('GET create で「有効」に初期チェックが入る', async () => {
    const html = await (await authRequest(`${base}/create`)).text()
    expect(html.match(/<input[^>]*name="is_active"[^>]*>/)?.[0]).toMatch(/\schecked=""/)
  })

  it('POST create の入力エラーで再表示すると、選択肢と入力値が残る', async () => {
    const m = await seedExpenseMasters()
    const html = await (
      await postForm(`${base}/create`, {
        name: '家賃',
        expense_category_id: m.rentId,
        description_pattern: '',
      })
    ).text()
    expect(html).toContain('食費')
    expect(html).toMatch(new RegExp(`<option value="${m.rentId}" selected=""`))
    expect(html.match(/<input[^>]*name="name"[^>]*>/)?.[0]).toMatch(/\svalue="家賃"/)
    expect(html.match(/<input[^>]*name="is_active"[^>]*>/)?.[0]).not.toMatch(/\schecked/)
  })

  it('POST create: 存在しないカテゴリは失敗メッセージ付きで一覧へ303', async () => {
    await seedExpenseMasters()
    const res = await postForm(`${base}/create`, {
      name: 'x',
      expense_category_id: 999,
      description_pattern: 'x',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(cookies(res).dangerMessage).toContain('追加に失敗しました')
    expect(await count('expense_check_template')).toBe(0)
  })

  it('POST [id]/update: 存在しないカテゴリは失敗メッセージ付きで一覧へ303', async () => {
    const m = await seedExpenseMasters()
    const id = await insertTemplate(m)
    const res = await postForm(`${base}/${id}/update`, {
      name: 'x',
      expense_category_id: 999,
      description_pattern: 'x',
    })
    expect(res.headers.get('Location')).toBe(base)
    expect(cookies(res).dangerMessage).toContain('編集に失敗しました')
    expect(await row('expense_check_template', id)).toMatchObject({ name: '家賃' })
  })

  it('GET 一覧で成功・失敗メッセージを表示する', async () => {
    const res = await authRequest(base, {
      headers: {
        Cookie: `successMessage=${encodeURIComponent('保存しました')}; dangerMessage=${encodeURIComponent('失敗しました')}`,
      },
    })
    const html = await res.text()
    expect(html).toContain('保存しました')
    expect(html).toContain('失敗しました')
  })

  it('POST [id]/update で更新して一覧へ303', async () => {
    const m = await seedExpenseMasters()
    const id = await insertTemplate(m, { is_active: 1 })
    const res = await postForm(`${base}/${id}/update`, {
      name: '駐車場',
      expense_category_id: m.rentId,
      payment_method_id: m.cashId,
      description_pattern: '駐車',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(cookies(res).successMessage).toContain('成功')
    expect(await row('expense_check_template', id)).toMatchObject({
      name: '駐車場',
      payment_method_id: m.cashId,
      description_pattern: '駐車',
      is_active: 0,
    })
  })

  it('POST [id]/update: 入力エラーはフォームを再表示して更新しない', async () => {
    const m = await seedExpenseMasters()
    const id = await insertTemplate(m)
    const res = await postForm(`${base}/${id}/update`, {
      name: '',
      expense_category_id: m.rentId,
      description_pattern: 'x',
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('名前は必須です')
    expect(await row('expense_check_template', id)).toMatchObject({ name: '家賃' })
  })

  it('GET [id]/update・[id]/delete で存在しないidは一覧へ303', async () => {
    for (const action of ['update', 'delete']) {
      const res = await authRequest(`${base}/999/${action}`)
      expect(res.status, action).toBe(303)
      expect(res.headers.get('Location'), action).toBe(base)
    }
  })

  it('GET [id]/delete で確認画面、POST で削除して一覧へ303', async () => {
    const m = await seedExpenseMasters()
    const id = await insertTemplate(m, { name: '消すテンプレ' })
    expect(await (await authRequest(`${base}/${id}/delete`)).text()).toContain('消すテンプレ')

    const res = await postForm(`${base}/${id}/delete`, {})
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe(base)
    expect(await count('expense_check_template')).toBe(0)
  })
})

describe('定期支払いチェック', () => {
  it('GET: 指定月の登録済み・未登録を表示する', async () => {
    const m = await seedExpenseMasters()
    await insertTemplate(m)
    await insertTemplate(m, { name: '駐車場', description_pattern: '駐車場' })
    await insert('expense', {
      date: '2026-09-27',
      amount: 80000,
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
      description: '9月分家賃',
    })

    const res = await authRequest('/auth/expense_check?year=2026&month=9')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('登録済み: 1件')
    expect(html).toContain('未登録: 1件')
    expect(html).toContain('¥80,000')
  })

  it('GET: 年月の指定が無ければ日本時間の今月', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-30T16:00:00Z')) // JST 10/1 01:00
    try {
      const html = await (await authRequest('/auth/expense_check')).text()
      expect(html).toMatch(/<option value="10" selected="">/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('GET: テンプレートが無ければ案内を表示する', async () => {
    const html = await (await authRequest('/auth/expense_check?year=2026&month=9')).text()
    expect(html).toContain('チェックテンプレートが登録されていません')
  })

  it('POST create: 登録して、その支出の年月のチェック画面へ303', async () => {
    const m = await seedExpenseMasters()
    const res = await postForm('/auth/expense_check/create', {
      date: '2026-09-27',
      amount: 80000,
      expense_category_id: m.rentId,
      payment_method_id: m.cardId,
      description: '家賃',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/auth/expense_check?year=2026&month=9')
    expect(await count('expense')).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('POST create: DBエラーは失敗メッセージ付きで、その年月へ戻る', async () => {
    const m = await seedExpenseMasters()
    const res = await postForm('/auth/expense_check/create', {
      date: '2026-09-27',
      amount: 1,
      expense_category_id: 999,
      payment_method_id: m.cardId,
      description: '',
    })
    expect(res.headers.get('Location')).toBe('/auth/expense_check?year=2026&month=9')
    expect(cookies(res).dangerMessage).toContain('支出追加に失敗しました')
    expect(await count('expense')).toBe(0)
  })

  it('POST create: 入力エラーは入力された日付の年月へ戻る', async () => {
    const res = await postForm('/auth/expense_check/create', {
      date: '2026-08-15',
      amount: 'abc',
      expense_category_id: 1,
      payment_method_id: 1,
      description: '',
    })
    expect(res.headers.get('Location')).toBe('/auth/expense_check?year=2026&month=8')
  })

  it('日付が不正な入力エラーでは現在の年月へ戻る', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-15T03:00:00Z'))
    try {
      const res = await postForm('/auth/expense_check/create', {
        date: 'abc',
        amount: 1,
        expense_category_id: 1,
        payment_method_id: 1,
        description: '',
      })
      expect(res.headers.get('Location')).toBe('/auth/expense_check?year=2026&month=9')
    } finally {
      vi.useRealTimers()
    }
  })
})
