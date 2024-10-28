import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'

type Bindings= {
    PROJECT_URL: string;
    API_KEY: string;
  }

const app = createApp()

showRoutes(app)

export default app
