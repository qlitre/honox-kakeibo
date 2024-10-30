import { createRoute } from 'honox/factory';
import { createMiddleware } from 'hono/factory';
import { checkauth } from '../checkauth';
import { bearerAuth } from 'hono/bearer-auth';


const authMiddleware = createMiddleware(async (c, next) => {
    const isAuthenticated = await checkauth(c);
    if (c.req.path.startsWith('/auth')) {
        if (isAuthenticated) {
            await next();
        } else {
            return c.redirect('/', 303);
        }
    } else if (c.req.path.startsWith('/api')) {
        // 仮 token
        const token = 'honoiscool';
        const auth = bearerAuth({ token });
        return auth(c, next)
    } else {
        await next();
    }
});

export default createRoute(authMiddleware);
