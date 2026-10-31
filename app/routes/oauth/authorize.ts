import { createRoute } from 'honox/factory'
import { verifyWithJwks } from 'hono/jwt'

export const GET = createRoute(async (c) => {
  const token = c.req.header('Cf-Access-Jwt-Assertion')
  if (!token) return c.text('Unauthorized', 401)

  let email: string
  try {
    const payload = await verifyWithJwks(
      token,
      {
        jwks_uri: `https://${c.env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`,
        allowedAlgorithms: ['RS256'],
        // 同じチームの別アプリ向けJWTを弾くため、このアプリ向け(aud)と発行元(iss)も確認する
        verification: {
          aud: c.env.CF_ACCESS_AUDIENCE,
          iss: `https://${c.env.CF_ACCESS_TEAM_DOMAIN}`,
        },
      },
      { cf: { cacheEverything: true, cacheTtl: 3600 } }
    )
    email = payload.email as string
  } catch {
    return c.text('Unauthorized', 401)
  }

  // Accessのポリシーに加えて、許可したメールアドレスだけを通す（未設定なら誰も通さない）
  const allowedEmails = (c.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (typeof email !== 'string' || !allowedEmails.includes(email.toLowerCase())) {
    return c.text('Forbidden', 403)
  }

  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw)
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId: email,
    scope: oauthReqInfo.scope,
    metadata: { email },
    props: { email },
  })
  return c.redirect(redirectTo)
})
