import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'
import { OAuthProvider } from '@cloudflare/workers-oauth-provider'
import type { Env } from 'hono'
import mcpApp from './routes/mcp'

const app = createApp()

// ルート一覧の出力は開発時だけ（本番では起動のたびにログが出るため）
if (import.meta.env.DEV) showRoutes(app)

type Bindings = Env['Bindings']

// workers-oauth-provider 1.x では resourceMetadata.resource（RFC 9728）が必須。
// 本番の URL は公開リポジトリに載せないため、git 管理外の wrangler.jsonc の
// vars.PUBLIC_ORIGIN から実行時に読む。env はリクエスト時にしか取れないので初回に生成する。
let provider: OAuthProvider<Bindings> | undefined

function getProvider(env: Bindings): OAuthProvider<Bindings> {
  if (!env.PUBLIC_ORIGIN) {
    throw new Error('PUBLIC_ORIGIN が未設定です（wrangler.jsonc の vars を確認してください）')
  }
  provider ??= new OAuthProvider<Bindings>({
    resourceMetadata: {
      resource: `${env.PUBLIC_ORIGIN}/mcp`,
      authorization_servers: [env.PUBLIC_ORIGIN],
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
  return provider
}

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return getProvider(env).fetch(request, env, ctx)
  },
}
