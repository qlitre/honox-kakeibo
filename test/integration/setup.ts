import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeAll, beforeEach, vi } from 'vitest'
import { resetDb } from '../helpers/db'

// Firebaseのセッション検証は外部JWKに依存するため差し替える。
// 本物と同じく「session Cookieが無ければ /login へリダイレクト」だけを再現する。
vi.mock('@hono/firebase-auth', () => ({
  verifySessionCookieFirebaseAuth: () => async (c: any, next: () => Promise<void>) => {
    const cookie = c.req.header('Cookie') ?? ''
    if (!/(?:^|;\s*)session=/.test(cookie)) {
      return c.redirect('/login')
    }
    await next()
  },
}))

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

beforeEach(async () => {
  await resetDb()
  // Slack通知など外部へのfetchは実際には送らない
  vi.restoreAllMocks()
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
})
