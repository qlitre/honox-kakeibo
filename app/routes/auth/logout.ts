import { createRoute } from 'honox/factory'
import { createClient } from "@supabase/supabase-js/dist/main/index.js";
import { deleteCookie } from 'hono/cookie';

export default createRoute(async (c) => {
    const supabase = createClient(c.env.PROJECT_URL, c.env.API_KEY)
    await supabase.auth.signOut()
    deleteCookie(c, 'supabase_token')
    return c.redirect('/')
})