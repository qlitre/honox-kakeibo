import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import worker from '@/server'

const BASE = 'http://localhost'

/** 本番と同じエントリ（OAuthProvider でラップされた app）にリクエストを投げる */
export async function request(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext()
  const res = await worker.fetch(
    new Request(BASE + path, { redirect: 'manual', ...init }),
    env,
    ctx
  )
  await waitOnExecutionContext(ctx)
  return res
}

/** ログイン済みセッション付きのリクエスト（認証はsetup.tsでモック） */
export function authRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  // 呼び出し側が渡したCookie（アラート用など）は残してセッションを追加する
  const cookie = headers.get('Cookie')
  headers.set('Cookie', cookie ? `${cookie}; session=test-session` : 'session=test-session')
  return request(path, { ...init, headers })
}

/** フォームPOST（ログイン済み） */
export function postForm(path: string, data: Record<string, string | number>) {
  const body = new URLSearchParams(Object.entries(data).map(([k, v]) => [k, String(v)]))
  return authRequest(path, { method: 'POST', body })
}
