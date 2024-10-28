import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  return c.render(
    <div className='c-container'>
      <a href="/login">ログイン</a>
    </div>,
    { title: 'hoge' }
  )
})
