import {} from 'hono'
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider'

declare module 'hono' {
  interface Env {
    Variables: {}
    Bindings: {
      HONO_IS_COOL: string
      DB: D1Database
      FB_API_KEY: string
      FB_AUTH_DOMAIN: string
      FB_PROJECT_ID: string
      FB_STORAGE_BUCKET: string
      FB_MESSAGE_SENDER_ID: string
      FB_APP_ID: string
      SLACK_WEBHOOK_URL: string
      // @hono/firebase-auth用の環境変数
      SERVICE_ACCOUNT_JSON: string
      PUBLIC_JWK_CACHE_KEY: string
      PUBLIC_JWK_CACHE_KV: KVNamespace
      OAUTH_KV: KVNamespace
      OAUTH_PROVIDER: OAuthHelpers
      CF_ACCESS_TEAM_DOMAIN: string
      CF_ACCESS_AUDIENCE: string
    }
  }
  interface ContextRenderer {
    (content: string | Promise<string>, props?: { title?: string }): Response | Promise<Response>
  }
}
