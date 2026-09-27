import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import {
  alertCookieMaxage,
  dangerAlertCookieKey,
  successAlertCookieKey,
} from '@/settings/kakeiboSettings'

/** 次の画面で一度だけ表示するアラート（Cookieで渡す） */
export const setFlash = (c: Context, kind: 'success' | 'danger', message: string) => {
  const key = kind === 'success' ? successAlertCookieKey : dangerAlertCookieKey
  setCookie(c, key, message, { maxAge: alertCookieMaxage })
}

/** 前の画面から渡されたアラート */
export const getFlash = (c: Context) => ({
  success: getCookie(c, successAlertCookieKey),
  danger: getCookie(c, dangerAlertCookieKey),
})

/**
 * 一覧へ戻るURL。元のクエリ（ページ・検索条件）を引き継ぎ、lastUpdate を付け直す
 * 例: /auth/expense?lastUpdate=3&page=2
 */
export const listUrl = (c: Context, endPoint: string, lastUpdate?: number) => {
  const params = new URLSearchParams(new URL(c.req.url).search)
  params.delete('lastUpdate')
  const query = [lastUpdate ? `lastUpdate=${lastUpdate}` : '', params.toString()]
    .filter(Boolean)
    .join('&')
  return `/auth/${endPoint}${query ? `?${query}` : ''}`
}
