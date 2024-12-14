import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  return c.render(
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-xl font-bold">
        <a href="/login" className="hover:underline">ログイン</a>
      </h1>
    </div>,
    { title: 'top' }
  )
})
