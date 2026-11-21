import { env } from 'cloudflare:workers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyWithJwks } from 'hono/jwt'
import { request } from '../../helpers/app'
import { count, insert } from '../../helpers/db'

// MCP（/mcp）が OAuth で保護されていることを、本番と同じエントリ（OAuthProvider）経由で検証する。
// Cloudflare Access のJWT検証（外部の公開鍵取得）だけ差し替える。
vi.mock('hono/jwt', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  verifyWithJwks: vi.fn(async () => ({ email: 'user@example.com' })),
}))

afterEach(() => {
  vi.useRealTimers()
})

const redirectUri = 'https://client.example/callback'

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const form = (data: Record<string, string>) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(data),
})

async function registerClient(uri = redirectUri) {
  const res = await request('/oauth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: [uri], token_endpoint_auth_method: 'none' }),
  })
  return ((await res.json()) as { client_id: string }).client_id
}

async function pkce(verifier = 'a'.repeat(64)) {
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  )
  return { verifier, challenge }
}

/** 認可コードを取得する（Access JWT は検証済みとしてモック） */
async function getCode(clientId: string, challenge: string, scope = 'mcp:write') {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: 'xyz',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  const res = await request(`/oauth/authorize?${query}`, {
    headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
  })
  expect(res.status).toBe(302)
  return new URL(res.headers.get('Location')!).searchParams.get('code')!
}

async function issueTokens(scope = 'mcp:write') {
  const clientId = await registerClient()
  const { verifier, challenge } = await pkce()
  const code = await getCode(clientId, challenge, scope)
  const res = await request(
    '/oauth/token',
    form({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    })
  )
  expect(res.status).toBe(200)
  const tokens = (await res.json()) as { access_token: string; refresh_token: string }
  return { clientId, code, verifier, tokens }
}

const rpc = (method: string, params?: unknown) =>
  JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })

function callMcp(path: string, headers: Record<string, string> = {}, body = rpc('tools/list')) {
  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body,
  })
}

const getAssetsCall = rpc('tools/call', { name: 'get_assets', arguments: { year: 2026, month: 9 } })

/** 拒否されたレスポンスに、資産データ（MCPの応答）が含まれていないこと */
async function expectNoLeak(res: Response) {
  const text = await res.text()
  expect(text).not.toContain('jsonrpc')
  expect(text).not.toContain('total_amount')
  expect(text).not.toContain('普通預金')
}

describe('/mcp は未認証では使えない', () => {
  it.each(['POST', 'GET', 'DELETE'])('トークンなしの %s は 401（WWW-Authenticate 付き）', async (method) => {
    const res = await request('/mcp', {
      method,
      headers: { Accept: 'application/json, text/event-stream' },
      ...(method === 'POST' ? { body: rpc('tools/list') } : {}),
    })
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toMatch(/^Bearer/)
    await expectNoLeak(res)
  })

  it('資産取得（get_assets）もトークンなしでは 401 で、データを返さない', async () => {
    await insert('asset_category', { name: '普通預金', is_investment: 0 })
    await insert('asset', { date: '2026-09-30', amount: 1_000_000, asset_category_id: 1 })
    const res = await callMcp('/mcp', {}, getAssetsCall)
    expect(res.status).toBe(401)
    await expectNoLeak(res)
  })

  it.each([
    ['存在しないトークン', 'Bearer not-a-real-token'],
    ['ユーザー・クライアント・シークレット形式のでたらめ', 'Bearer aaaa:bbbb:cccc'],
    ['空のBearer', 'Bearer '],
    ['Basic認証', 'Basic dXNlcjpwYXNz'],
    ['スキームなし', 'not-a-real-token'],
    ['bearer（小文字）+ でたらめ', 'bearer not-a-real-token'],
  ])('不正な Authorization（%s）は 401', async (_name, authorization) => {
    const res = await callMcp('/mcp', { Authorization: authorization }, getAssetsCall)
    expect(res.status).toBe(401)
    await expectNoLeak(res)
  })

  it('トークンをクエリ文字列で渡しても認証されない', async () => {
    const { tokens } = await issueTokens()
    const res = await callMcp(`/mcp?access_token=${tokens.access_token}`, {}, getAssetsCall)
    expect(res.status).toBe(401)
  })

  it('Cf-Access-Jwt-Assertion ヘッダだけでは /mcp を通れない', async () => {
    const res = await callMcp('/mcp', { 'Cf-Access-Jwt-Assertion': 'valid' }, getAssetsCall)
    expect(res.status).toBe(401)
  })

  it('Firebase のセッションCookieでは /mcp を通れない', async () => {
    const res = await callMcp('/mcp', { Cookie: 'session=test-session' }, getAssetsCall)
    expect(res.status).toBe(401)
  })

  it('リフレッシュトークンをアクセストークンとして使っても 401', async () => {
    const { tokens } = await issueTokens()
    const res = await callMcp(
      '/mcp',
      { Authorization: `Bearer ${tokens.refresh_token}` },
      getAssetsCall
    )
    expect(res.status).toBe(401)
  })

  it('認可コードをアクセストークンとして使っても 401', async () => {
    const { code } = await issueTokens()
    const res = await callMcp('/mcp', { Authorization: `Bearer ${code}` }, getAssetsCall)
    expect(res.status).toBe(401)
  })

  it('有効なトークンの一部を改ざんしたら 401', async () => {
    const { tokens } = await issueTokens()
    const t = tokens.access_token
    const tampered = t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a')
    const res = await callMcp('/mcp', { Authorization: `Bearer ${tampered}` }, getAssetsCall)
    expect(res.status).toBe(401)
  })

  it('アクセストークンは有効期限（1時間）を過ぎると 401', async () => {
    const { tokens } = await issueTokens()
    const headers = { Authorization: `Bearer ${tokens.access_token}` }
    expect((await callMcp('/mcp', headers, getAssetsCall)).status).toBe(200)

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 3601 * 1000)
    const res = await callMcp('/mcp', headers, getAssetsCall)
    expect(res.status).toBe(401)
    await expectNoLeak(res)
  })
})

describe('/mcp の保護を迂回できない', () => {
  // HonoX は routes/mcp.ts を /mcp にマウントするため、内側の /mcp は /mcp/mcp としても存在する。
  // /mcp 配下は OAuthProvider が先に受け取ってして 401 にすること。
  it.each(['/mcp/', '/mcp/mcp', '/mcp/anything', '/mcp?x=1', '/mcp#frag', '/mcp/../mcp'])(
    '%s もトークンなしでは 401',
    async (path) => {
      const res = await callMcp(path, {}, getAssetsCall)
      expect(res.status).toBe(401)
      await expectNoLeak(res)
    }
  )

  it('/mcpx のような別パスは MCP に到達しない（401 か 404）', async () => {
    const res = await callMcp('/mcpx', {}, getAssetsCall)
    expect([401, 404]).toContain(res.status)
    await expectNoLeak(res)
  })

  // パスのパーセントエンコード・大文字小文字・二重スラッシュで OAuthProvider をすり抜けて
  // 内側の Hono（/mcp ルート）に直接届かないこと。届かなければ 401 か 404 になる。
  it.each(['/%6dcp', '/m%63p', '/%6D%63%70', '/MCP', '/Mcp', '//mcp', '/./mcp', '/mcp%2F'])(
    '%s で認証をすり抜けて MCP に到達しない',
    async (path) => {
      const res = await callMcp(path, {}, getAssetsCall)
      expect([401, 404]).toContain(res.status)
      await expectNoLeak(res)
    }
  )

  it('HTTPメソッドを変えても（PUT/PATCH/OPTIONS以外）未認証では通らない', async () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const res = await request('/mcp', { method, body: getAssetsCall })
      expect(res.status, method).toBe(401)
    }
  })

  it('他のルートで MCP の内部ツールが公開されていない', async () => {
    for (const path of ['/smoketest', '/api', '/api/assets', '/.well-known/mcp']) {
      const res = await callMcp(path, {}, getAssetsCall)
      await expectNoLeak(res)
    }
  })
})

describe('有効なトークンなら /mcp を使える（対照）', () => {
  it('get_assets をトークン付きで呼べる', async () => {
    const bank = await insert('asset_category', { name: '普通預金', is_investment: 0 })
    await insert('asset', { date: '2026-09-30', amount: 1_000_000, asset_category_id: bank })
    const { tokens } = await issueTokens()
    const res = await callMcp(
      '/mcp',
      { Authorization: `Bearer ${tokens.access_token}` },
      getAssetsCall
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('1000000')
  })

  it('スキーム名 Bearer は大文字小文字を区別しない（RFC 6750）', async () => {
    const { tokens } = await issueTokens()
    const res = await callMcp(
      '/mcp',
      { Authorization: `bearer ${tokens.access_token}` },
      getAssetsCall
    )
    expect(res.status).toBe(200)
  })
})

describe('OAuth の認可フロー', () => {
  it('Access JWT がなければ認可コードを発行しない', async () => {
    const clientId = await registerClient()
    const { challenge } = await pkce()
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'mcp:write',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })
    const res = await request(`/oauth/authorize?${query}`)
    expect(res.status).toBe(401)
    expect(res.headers.get('Location')).toBeNull()
  })

  it('JWT の email が無い・文字列でない場合は認可しない', async () => {
    const clientId = await registerClient()
    const { challenge } = await pkce()
    for (const payload of [{}, { email: 123 }, { email: null }, { email: ['user@example.com'] }]) {
      vi.mocked(verifyWithJwks).mockResolvedValueOnce(payload as never)
      const query = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'mcp:write',
        code_challenge: challenge,
        code_challenge_method: 'S256',
      })
      const res = await request(`/oauth/authorize?${query}`, {
        headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
      })
      expect(res.status, JSON.stringify(payload)).toBe(403)
      expect(res.headers.get('Location')).toBeNull()
    }
  })

  it('ALLOWED_EMAILS が未設定・空なら誰も認可しない', async () => {
    const original = env.ALLOWED_EMAILS
    try {
      for (const value of [undefined, '', ' , ,']) {
        ;(env as { ALLOWED_EMAILS?: string }).ALLOWED_EMAILS = value
        const res = await request('/oauth/authorize', {
          headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
        })
        expect(res.status, String(value)).toBe(403)
      }
    } finally {
      ;(env as { ALLOWED_EMAILS?: string }).ALLOWED_EMAILS = original
    }
  })

  it('ALLOWED_EMAILS の部分一致・別ドメインでは通らない', async () => {
    for (const email of ['user@example.com.evil.test', 'xuser@example.com', 'user@example.co']) {
      vi.mocked(verifyWithJwks).mockResolvedValueOnce({ email })
      const res = await request('/oauth/authorize', {
        headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
      })
      expect(res.status, email).toBe(403)
    }
  })

  it('登録していない redirect_uri には認可コードを返さない', async () => {
    const clientId = await registerClient()
    const { challenge } = await pkce()
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: 'https://attacker.example/steal',
      scope: 'mcp:write',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })
    const res = await request(`/oauth/authorize?${query}`, {
      headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
    })
    expect(res.headers.get('Location') ?? '').not.toContain('attacker.example')
    expect(res.status).not.toBe(302)
  })

  it('存在しない client_id では認可コードを発行しない', async () => {
    const { challenge } = await pkce()
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: 'unknown-client',
      redirect_uri: redirectUri,
      scope: 'mcp:write',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    })
    const res = await request(`/oauth/authorize?${query}`, {
      headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
    })
    expect(res.status).not.toBe(302)
  })
})

describe('OAuth のトークン発行', () => {
  it('認可コードは一度しか使えない（再利用は失敗）', async () => {
    const { clientId, code, verifier } = await issueTokens()
    const res = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: verifier,
      })
    )
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('access_token')
  })

  it('PKCE の code_verifier が違うとトークンを発行しない', async () => {
    const clientId = await registerClient()
    const { challenge } = await pkce()
    const code = await getCode(clientId, challenge)
    const res = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: 'b'.repeat(64),
      })
    )
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('access_token')
  })

  it('code_verifier を省略するとトークンを発行しない', async () => {
    const clientId = await registerClient()
    const { challenge } = await pkce()
    const code = await getCode(clientId, challenge)
    const res = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
      })
    )
    expect(res.status).toBe(400)
  })

  it('別クライアントの client_id では認可コードを交換できない', async () => {
    const clientA = await registerClient()
    const clientB = await registerClient()
    const { verifier, challenge } = await pkce()
    const code = await getCode(clientA, challenge)
    const res = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientB,
        code_verifier: verifier,
      })
    )
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('access_token')
  })

  it('redirect_uri が認可時と違うと交換できない', async () => {
    const clientId = await registerClient()
    const { verifier, challenge } = await pkce()
    const code = await getCode(clientId, challenge)
    const res = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://attacker.example/steal',
        client_id: clientId,
        code_verifier: verifier,
      })
    )
    expect(res.status).toBe(400)
  })

  it('でたらめな認可コード・リフレッシュトークンでは発行しない', async () => {
    const clientId = await registerClient()
    const bad = await request(
      '/oauth/token',
      form({
        grant_type: 'authorization_code',
        code: 'forged-code',
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: 'a'.repeat(64),
      })
    )
    expect(bad.status).toBe(400)
    const badRefresh = await request(
      '/oauth/token',
      form({ grant_type: 'refresh_token', refresh_token: 'forged', client_id: clientId })
    )
    expect(badRefresh.status).toBe(400)
  })

  it('別クライアントではリフレッシュトークンを使えない', async () => {
    const { tokens } = await issueTokens()
    const other = await registerClient()
    const res = await request(
      '/oauth/token',
      form({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: other })
    )
    expect(res.status).toBe(400)
    expect(await res.text()).not.toContain('access_token')
  })

  it('リフレッシュトークンは30日を過ぎると使えない', async () => {
    const { clientId, tokens } = await issueTokens()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 31 * 24 * 3600 * 1000)
    const res = await request(
      '/oauth/token',
      form({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token, client_id: clientId })
    )
    expect(res.status).toBe(400)
  })

  it('grant_type が未対応・未指定ならトークンを発行しない', async () => {
    const clientId = await registerClient()
    for (const grant_type of ['password', 'client_credentials', '']) {
      const res = await request('/oauth/token', form({ grant_type, client_id: clientId }))
      expect(res.status, grant_type).toBeGreaterThanOrEqual(400)
      expect(await res.text()).not.toContain('access_token')
    }
  })
})

describe('スコープ', () => {
  // 現状 add_payment / get_assets はスコープを確認していない（既知・意図的）。
  // MCPを使うのは本人だけで、認可できるのも ALLOWED_EMAILS の本人のみのため、強制しない方針。
  // 将来スコープを強制したら、この it.fails を it に変える。
  it.fails('mcp:get だけのトークンでは add_payment（書き込み）できない', async () => {
    const category = await insert('expense_category', { name: '食費' })
    const method = await insert('payment_method', { name: '現金' })
    const { tokens } = await issueTokens('mcp:get')
    const res = await callMcp(
      '/mcp',
      { Authorization: `Bearer ${tokens.access_token}` },
      rpc('tools/call', {
        name: 'add_payment',
        arguments: { amount: 100, expense_category_id: category, payment_method_id: method },
      })
    )
    const body = await res.text()
    expect(body.includes('"isError":true') || res.status === 403).toBe(true)
    expect(await count('expense')).toBe(0)
  })
})
