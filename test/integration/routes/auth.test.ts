import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { authRequest, postForm, rawSetCookie, request } from '../../helpers/app'
import { count } from '../../helpers/db'

// Firebase SDK は外部通信するため差し替える（ログイン・ログアウトの分岐だけを検証する）
vi.mock('@/firebase', () => ({ auth: () => ({}) }))
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock('firebase-auth-cloudflare-workers', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ServiceAccountCredential: class {},
  AdminAuthApiClient: {
    getOrInitialize: () => ({ createSessionCookie: async () => 'session-cookie-from-firebase' }),
  },
}))

beforeEach(() => {
  vi.mocked(signInWithEmailAndPassword).mockReset()
  vi.mocked(signOut).mockReset()
})

describe('未ログイン', () => {
  it.each([
    ['GET', '/auth'],
    ['GET', '/auth/expense'],
    ['GET', '/auth/dashboard/2026/9/monthly_balance'],
    ['POST', '/auth/expense/create'],
    ['POST', '/auth/expense/1/delete'],
    ['POST', '/auth/expense_category/1/delete'],
  ])('%s %s は /login へリダイレクトし、処理を実行しない', async (method, path) => {
    const res = await request(path, {
      method,
      body:
        method === 'POST'
          ? new URLSearchParams({
              date: '2026-09-01',
              amount: '1',
              expense_category_id: '1',
              payment_method_id: '1',
              description: '',
            })
          : undefined,
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/login')
    expect(await count('expense')).toBe(0)
  })

  it('トップページはログインへのリンクを表示する', async () => {
    const res = await request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('href="/login"')
  })

  it('存在しないページは404', async () => {
    const res = await request('/no/such/page')
    expect(res.status).toBe(404)
  })
})

describe('ログイン', () => {
  const valid = { email: 'user@example.com', password: 'password123' }

  it('GET でフォームを表示する', async () => {
    const res = await request('/login')
    expect(res.status).toBe(200)
  })

  it('入力エラーはフォームを再表示し、Firebaseを呼ばない', async () => {
    const res = await postForm('/login', { email: 'x', password: 'short' })
    expect(res.status).toBe(200)
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled()
    expect(rawSetCookie(res, 'session')).toBeUndefined()
  })

  it('成功するとセッションCookie（HttpOnly・Secure・SameSite=Strict・5日）を発行して /auth へ303', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: { getIdToken: async () => 'id-token' },
    } as any)

    const res = await postForm('/login', valid)

    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/auth')
    const cookie = rawSetCookie(res, 'session')!
    expect(cookie).toMatch(/^session=session-cookie-from-firebase;/)
    expect(cookie).toContain('Max-Age=432000')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Strict')
    expect(cookie).toContain('Path=/')
  })

  it('Firebaseがエラーを返すと、メッセージ付きでフォームを再表示する', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('auth/invalid-credential'))
    const res = await postForm('/login', valid)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('auth/invalid-credential')
    expect(rawSetCookie(res, 'session')).toBeUndefined()
  })
})

describe('ログイン後', () => {
  it('/auth にメニューを表示する', async () => {
    const res = await authRequest('/auth')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('<title>家計簿ダッシュボード</title>')
    expect(html).toContain('href="/auth/expense"')
  })

  it('ログアウトでセッションCookieを消して / へ303', async () => {
    vi.mocked(signOut).mockResolvedValue()
    const res = await authRequest('/auth/logout')
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/')
    expect(rawSetCookie(res, 'session')).toMatch(/Max-Age=0/)
  })

  it('ログアウトに失敗すると500', async () => {
    vi.mocked(signOut).mockRejectedValue(new Error('network'))
    const res = await authRequest('/auth/logout')
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('Logout failed')
  })
})

describe('MCP用OAuth', () => {
  it('Cloudflare AccessのJWTが無ければ401', async () => {
    const res = await request('/oauth/authorize')
    expect(res.status).toBe(401)
  })

  it('JWTを検証できなければ401', async () => {
    const res = await request('/oauth/authorize', {
      headers: { 'Cf-Access-Jwt-Assertion': 'invalid' },
    })
    expect(res.status).toBe(401)
  })

  it('/mcp はアクセストークンが無ければ401', async () => {
    const res = await request('/mcp', { method: 'POST' })
    expect(res.status).toBe(401)
  })
})
