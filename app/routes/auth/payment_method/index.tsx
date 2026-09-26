import type { PaymentMethod } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { fetchSimpleList } from '@/libs/dbService'
import { getCookie } from 'hono/cookie'
import { dangerAlertCookieKey, successAlertCookieKey } from '@/settings/kakeiboSettings'
import { CategoryList } from '@/components/share/CategoryList'

export default createRoute(async (c) => {
  const message = getCookie(c, successAlertCookieKey)
  const dangerMessage = getCookie(c, dangerAlertCookieKey)
  const pageTitle = '支払方法一覧'
  const endPoint = 'payment_method'
  const categories = await fetchSimpleList<PaymentMethod>({
    db: c.env.DB,
    table: endPoint,
  })
  return c.render(
    <>
      <CategoryList
        message={message}
        dangerMessage={dangerMessage}
        categories={categories.contents}
        pageTitle={pageTitle}
        endpoint={endPoint}
      ></CategoryList>
    </>,
    { title: pageTitle }
  )
})
