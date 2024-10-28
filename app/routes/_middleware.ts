import { createRoute } from 'honox/factory'
import { createMiddleware } from 'hono/factory'
import { checkauth } from '../checkauth'

export const supabaseMiddleware = createMiddleware(async (c, next) => {
    if (c.req.path.startsWith('/auth')) {
        const f = await checkauth(c)
        if (f) {
            await next()
            return
        } else {
            return c.redirect('/', 303)
        }
    }
    await next()
})

export default createRoute(supabaseMiddleware)
