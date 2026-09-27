import type { Context } from 'hono'
import type { z } from 'zod'
import type { RowOf } from '@/@types/dbTypes'
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { createItem, deleteItem, updateItem } from '@/libs/dbService'
import { listUrl, setFlash } from '@/libs/flash'
import { sendSlackNotification } from '@/libs/slack'

type TransactionTable = 'expense' | 'income' | 'asset' | 'fund_transaction'

export type TransactionConfig<N extends TransactionTable, S extends z.ZodObject, D> = {
  table: N
  /** 画面・メッセージ用の名前（例: 支出） */
  label: string
  /** フォーム（create・update 共通）のバリデーション */
  form: S
  /** フォーム値 → DBに保存する値 */
  toData: (form: z.output<S>) => D
  /** Slack通知で日付と金額の間に入れる行（カテゴリなど） */
  slackDetails: (item: RowOf[N]) => string[]
  /** 保存前の検査。理由を返すと保存せず一覧へ戻す（excludeId は更新時の自分自身） */
  check?: (db: D1Database, data: D, excludeId?: number) => Promise<string | undefined>
  /** 一覧以外へ戻すとき（date は入力された日付。入力エラー時は不正な値もありうる） */
  backUrl?: (date: unknown) => string
}

/** 明細（支出・収入・資産・入金履歴）の create / update / delete の POST ハンドラ */
export const transactionRoutes = <
  N extends TransactionTable,
  S extends z.ZodObject,
  D extends Record<string, unknown>,
>(
  config: TransactionConfig<N, S, D>
) => {
  const { table, label, form, toData, check, backUrl } = config
  const back = (c: Context, date: unknown, lastUpdate?: number) =>
    backUrl ? backUrl(date) : listUrl(c, table, lastUpdate)
  const fail = (c: Context, action: string, date: unknown, reason = '') => {
    setFlash(c, 'danger', `${label}${action}に失敗しました。${reason}`)
    return c.redirect(back(c, date), 303)
  }
  const validator = (action: string) =>
    zValidator('form', form, (result, c) => {
      if (!result.success) {
        return fail(c, action, result.data.date, '入力内容を確認してください。')
      }
    })

  const create = createRoute(validator('追加'), async (c) => {
    const data = toData(c.req.valid('form') as z.output<S>)
    const reason = await check?.(c.env.DB, data)
    if (reason) return fail(c, '追加', data.date, reason)

    let item: RowOf[N]
    try {
      item = await createItem({ db: c.env.DB, table, data })
    } catch (err) {
      console.error(`${table} create error:`, err)
      return fail(c, '追加', data.date)
    }
    setFlash(c, 'success', `${label}追加に成功しました`)
    await sendSlackNotification(slackMessage(config, item), c.env.SLACK_WEBHOOK_URL)
    return c.redirect(back(c, data.date, item.id), 303)
  })

  const update = createRoute(validator('編集'), async (c) => {
    const id = Number(c.req.param('id'))
    const data = toData(c.req.valid('form') as z.output<S>)
    // 日付だけ・カテゴリだけの変更でも重複しうるため、自分自身を除いて常に検査する
    const reason = await check?.(c.env.DB, data, id)
    if (reason) return fail(c, '編集', data.date, reason)

    try {
      await updateItem({ db: c.env.DB, table, id, data })
    } catch (err) {
      console.error(`${table} update error:`, err)
      return fail(c, '編集', data.date)
    }
    setFlash(c, 'success', `${label}編集に成功しました`)
    return c.redirect(back(c, data.date, id), 303)
  })

  const remove = createRoute(async (c) => {
    try {
      await deleteItem({ db: c.env.DB, table, id: c.req.param('id')! })
    } catch (err) {
      console.error(`${table} delete error:`, err)
      return fail(c, '削除', undefined)
    }
    setFlash(c, 'success', `${label}削除に成功しました`)
    return c.redirect(back(c, undefined), 303)
  })

  return { create, update, delete: remove }
}

/** 追加時のSlack通知 */
const slackMessage = <N extends TransactionTable>(
  config: Pick<TransactionConfig<N, z.ZodObject, unknown>, 'label' | 'slackDetails'>,
  item: RowOf[N]
) =>
  [
    `${config.label}が追加されました。`,
    item.date,
    ...config.slackDetails(item),
    `金額: ${item.amount}`,
    `詳細: ${item.description}`,
  ].join('\n')
