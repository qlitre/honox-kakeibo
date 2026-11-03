import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'
import { OAuthProvider } from '@cloudflare/workers-oauth-provider'
import mcpApp from './routes/mcp'

const app = createApp()

// ルート一覧の出力は開発時だけ（本番では起動のたびにログが出るため）
if (import.meta.env.DEV) showRoutes(app)

// workers-oauth-provider 1.x では resourceMetadata.resource（RFC 9728）が必須。
// トークンの audience はこの URL とポートまで厳密に照合されるため、環境ごとに切り替える。
// http はループバックホストでのみ許可される。
const ORIGIN =
  import.meta.env.MODE === 'test'
    ? 'http://localhost' // test/helpers/app.ts の BASE と一致させる
    : import.meta.env.DEV
      ? 'http://localhost:5173' // vite dev サーバー
      : 'https://honox-kakeibo.qlitre.workers.dev'

export default new OAuthProvider({
  resourceMetadata: {
    resource: `${ORIGIN}/mcp`,
    authorization_servers: [ORIGIN],
  },
  apiRoute: '/mcp',
  apiHandler: mcpApp,
  defaultHandler: app,
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['mcp:write', 'mcp:get'],
  // アクセストークン1時間、リフレッシュトークン30日（期限内は再認証なしで更新できる）
  accessTokenTTL: 3600,
  refreshTokenTTL: 30 * 24 * 3600,
})
