import { createRoute } from 'honox/factory'
import { Header } from '../../islands/Header'
import { PieChartTest } from '../../islands/PieChartTest'

export default createRoute(async (c) => {
    return c.render(
        <>
            <Header></Header>
            <main className='c-container'>
                <h1 className='text-center text-xl font-bold'>メインページ</h1>
                <h1 className='text-center text-xl font-bold mt-4'>テストチャート</h1>                
                <PieChartTest></PieChartTest>
            </main>
        </>,
        { title: 'top' }
    )
})
