import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  return c.render(
    <div className='c-container flex items-center justify-center'>
      <h1 className='text-xl font-bold'>
        <div>
          <a className='just' href="/login">ログイン</a>
        </div>
      </h1>
    </div>,
    { title: 'top' }
  )
})
