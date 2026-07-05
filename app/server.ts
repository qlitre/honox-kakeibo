import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'
import api from './api'
import { OAuthProvider } from '@cloudflare/workers-oauth-provider'
import mcpApp from './routes/mcp'

const app = createApp()

app.route('/api', api)

showRoutes(app)

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
