import '@hono/react-renderer'
import { } from 'hono'



declare module 'hono' {
  interface Env {
    Variables: {}
    Bindings: {
      PROJECT_URL: string;
      API_KEY: string;
      HONO_IS_COOL: string;
      BASE_URL: string;
      DB: D1Database;
      FB_API_KEY: string;
      FB_AUTH_DOMAIN: string;
      FB_PROJECT_ID: string;
      FB_STORAGE_BUCKET: string;
      FB_MESSAGE_SENDER_ID: string;
      FB_APP_ID: string;
    }
  }
}

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
