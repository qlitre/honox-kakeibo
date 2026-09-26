import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { authRequest, postForm, request } from '../helpers/app'
import { insert, seedExpenseMasters } from '../helpers/db'

// Phase 0 の実証: workerd + D1 + HonoXルーティング + 認証モックが噛み合うことを確認する

describe('認証', () => {
  it('未ログインで /auth 配下にアクセスすると /login へリダイレクトされる', async () => {
    const res = await request('/auth/expense')
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/login')
  })

  it('削除済みの /api は公開されていない', async () => {
    for (const path of ['/api/expense', '/api/doc', '/api/ui']) {
      const res = await request(path)
      expect(res.status, path).toBe(404)
    }
  })
})

describe('支出の登録', () => {
  it('POST /auth/expense/create で登録される', async () => {
    const { foodId, cardId } = await seedExpenseMasters()

    const res = await postForm('/auth/expense/create', {
      date: '2026-09-01',
      amount: 1200,
      expense_category_id: foodId,
      payment_method_id: cardId,
      description: 'ランチ',
    })

    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toMatch(/^\/auth\/expense\?lastUpdate=\d+$/)

    // Slack通知が送られている
    expect(fetch).toHaveBeenCalledWith(env.SLACK_WEBHOOK_URL, expect.anything())

    const { results } = await env.DB.prepare('SELECT * FROM expense').all()
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      date: '2026-09-01',
      amount: 1200,
      expense_category_id: foodId,
      payment_method_id: cardId,
      description: 'ランチ',
    })
  })

  it('バリデーションエラー時はDBに書き込まれない', async () => {
    const { foodId, cardId } = await seedExpenseMasters()
    const res = await postForm('/auth/expense/create', {
      date: '2026-9-1',
      amount: 'abc',
      expense_category_id: foodId,
      payment_method_id: cardId,
      description: '',
    })
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/auth/expense')

    const { total } = (await env.DB.prepare('SELECT COUNT(*) AS total FROM expense').first<{
      total: number
    }>())!
    expect(total).toBe(0)
  })

  it('ログイン後の一覧画面がSSRで描画され、登録済みの支出が表示される', async () => {
    const { foodId, cashId } = await seedExpenseMasters()
    await insert('expense', {
      date: '2026-09-02',
      amount: 3456,
      expense_category_id: foodId,
      payment_method_id: cashId,
      description: 'スーパー',
    })

    const res = await authRequest('/auth/expense')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('<title>支出リスト</title>')
    expect(html).toContain('スーパー')
  })
})
