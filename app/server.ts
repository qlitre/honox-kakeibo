import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'
import { OAuthProvider } from '@cloudflare/workers-oauth-provider'
import mcpApp from './routes/mcp'

const app = createApp()

// ルート一覧の出力は開発時だけ（本番では起動のたびにログが出るため）
if (import.meta.env.DEV) showRoutes(app)

export default new OAuthProvider({
  apiRoute: '/mcp',
  apiHandler: mcpApp,
  defaultHandler: app,
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['mcp:write', 'mcp:get'],
  // TODO: 7/23以降に accessTokenTTL: 3600, refreshTokenTTL: 30 * 24 * 3600 に戻す
  accessTokenTTL: 900,
  refreshTokenTTL: 0,
})
