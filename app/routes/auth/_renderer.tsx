import { reactRenderer } from '@hono/react-renderer'
import { Header } from '../../islands/Header'

export default reactRenderer(({ children, Layout, title }) => {
    return (
        <Layout title={title}>
            <>
                <Header></Header>
                <main className='container mx-auto py-16 px-4'>
                    {children}
                </main>
            </>
        </Layout>
    )
})