import { createRoute } from 'honox/factory';
import { createMiddleware } from 'hono/factory';
import { bearerAuth } from 'hono/bearer-auth';
import { checkauthFb } from '@/checkauthFb';

// Firebaseでテスト
const authMiddleware = createMiddleware(async (c, next) => {
    if (c.req.path.startsWith('/auth')) {
        const isAuthenticated = await checkauthFb(c);
        if (isAuthenticated) {
            await next();
        } else {
            return c.redirect('/', 303);
        }
    } else if (c.req.path.startsWith('/api')) {
        const token = c.env.HONO_IS_COOL;
        const auth = bearerAuth({ token });
        return auth(c, next)
    } else {
        await next();
    }
});

export default createRoute(authMiddleware);
