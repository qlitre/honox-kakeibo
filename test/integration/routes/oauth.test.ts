import { describe, expect, it, vi } from 'vitest'
import { request } from '../../helpers/app'

// Cloudflare Access のJWT検証（外部の公開鍵を取りに行く）だけ差し替える
vi.mock('hono/jwt', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  verifyWithJwks: vi.fn(async () => ({ email: 'user@example.com' })),
}))

const redirectUri = 'https://client.example/callback'

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** クライアント登録 → 認可 → 認可コードをトークンに交換（PKCE） */
async function issueTokens() {
  const registered = await request('/oauth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: [redirectUri], token_endpoint_auth_method: 'none' }),
  })
  const { client_id } = (await registered.json()) as { client_id: string }

  const verifier = 'a'.repeat(64)
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  )
  const query = new URLSearchParams({
    response_type: 'code',
    client_id,
    redirect_uri: redirectUri,
    scope: 'mcp:write',
    state: 'xyz',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  const authorized = await request(`/oauth/authorize?${query}`, {
    headers: { 'Cf-Access-Jwt-Assertion': 'valid' },
  })
  expect(authorized.status).toBe(302)
  const code = new URL(authorized.headers.get('Location')!).searchParams.get('code')!

  const res = await request('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id,
      code_verifier: verifier,
    }),
  })
  expect(res.status).toBe(200)
  return { client_id, tokens: (await res.json()) as Record<string, unknown> }
}

describe('MCP用OAuthのトークン', () => {
  it('アクセストークンは1時間で、リフレッシュトークンも発行する', async () => {
    const { tokens } = await issueTokens()
    expect(tokens.expires_in).toBe(3600)
    expect(tokens.refresh_token).toEqual(expect.any(String))
  })

  it('リフレッシュトークンで新しいアクセストークンを取得できる', async () => {
    const { client_id, tokens } = await issueTokens()
    const res = await request('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token as string,
        client_id,
      }),
    })
    expect(res.status).toBe(200)
    const refreshed = (await res.json()) as Record<string, unknown>
    expect(refreshed.access_token).toEqual(expect.any(String))
    expect(refreshed.access_token).not.toBe(tokens.access_token)
  })

  it('発行したアクセストークンで /mcp に認証を通過できる', async () => {
    const { tokens } = await issueTokens()
    const res = await request('/mcp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    })
    expect(res.status).not.toBe(401)
  })
})
