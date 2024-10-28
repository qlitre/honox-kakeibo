import { createRoute } from 'honox/factory'
import { Header } from '../../islands/Header'

export default createRoute(async (c) => {
    return c.render(
        <>
            <Header></Header>
            <main>
                main
            </main>
        </>,
        { title: 'hoge' }
    )
})
