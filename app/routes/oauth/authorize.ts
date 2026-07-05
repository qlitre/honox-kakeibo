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
      },
      { cf: { cacheEverything: true, cacheTtl: 3600 } }
    )
    email = payload.email as string
  } catch {
    return c.text('Unauthorized', 401)
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
