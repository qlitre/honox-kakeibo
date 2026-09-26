/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { D1Migration } from '@cloudflare/vitest-pool-workers'
import type { Env as HonoEnv } from 'hono'

type AppBindings = NonNullable<HonoEnv['Bindings']>

declare global {
  namespace Cloudflare {
    interface Env extends AppBindings {
      TEST_MIGRATIONS: D1Migration[]
    }
  }
}
