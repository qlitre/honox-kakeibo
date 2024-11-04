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
    }
  }
}

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
