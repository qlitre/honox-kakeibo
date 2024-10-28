import '@hono/react-renderer'
import { } from 'hono'



declare module 'hono' {
  interface Env {
    Variables: {}
    Bindings: {
      PROJECT_URL: string;
      API_KEY: string;
    }
  }
}

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
