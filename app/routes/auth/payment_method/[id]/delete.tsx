import { createRoute } from 'honox/factory'
import { deleteItem, fetchDetail, isForeignKeyConstraintError } from '@/libs/dbService'
import { CategoryDeleteForm } from '@/components/share/CategoryDeleteForm'
import { setCookie } from 'hono/cookie'
import {
  alertCookieMaxage,
  dangerAlertCookieKey,
  successAlertCookieKey,
} from '@/settings/kakeiboSettings'

const endPoint = 'payment_method'
const title = '支払方法削除'
const successMessage = '支払方法の削除に成功しました'
const redirectUrl = '/auth/payment_method'
const inUseMessage =
  'この支払方法は明細で使われているため削除できません。先に明細を変更してください。'

export default createRoute(async (c) => {
  const id = c.req.param('id')!
  const detail = await fetchDetail({
    db: c.env.DB,
    table: endPoint,
    id: id,
  })
  if (!detail) {
    return c.redirect(redirectUrl, 303)
  }
  return c.render(
    <>
      <CategoryDeleteForm title={title} detail={detail} endPoint={endPoint} />
    </>,
    { title: title }
  )
})

export const POST = createRoute(async (c) => {
  const id = c.req.param('id')!
  try {
    await deleteItem({ db: c.env.DB, table: endPoint, id: id })
  } catch (err) {
    // 明細から参照されている場合は外部キー制約で削除できない
    if (!isForeignKeyConstraintError(err)) throw err
    setCookie(c, dangerAlertCookieKey, inUseMessage, { maxAge: alertCookieMaxage })
    return c.redirect(redirectUrl, 303)
  }
  setCookie(c, successAlertCookieKey, successMessage, {
    maxAge: alertCookieMaxage,
  })
  return c.redirect(redirectUrl, 303)
})
