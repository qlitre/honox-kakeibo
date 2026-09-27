import type { Context } from 'hono'
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createItem, fetchDetail, fetchSimpleList, updateItem } from '@/libs/dbService'
import { setFlash } from '@/libs/flash'
import {
  ExpenseCheckTemplateForm,
  type ExpenseCheckTemplateFormData,
} from '@/components/ExpenseCheckTemplateForm'

const table = 'expense_check_template'
const listUrl = `/auth/${table}`

const form = z.object({
  name: z.string().min(1, '名前は必須です'),
  expense_category_id: z.string().min(1, 'カテゴリは必須です'),
  payment_method_id: z.string().optional(),
  description_pattern: z.string().min(1, '検索パターンは必須です'),
  // チェックボックスはチェック時だけ 1 が送られる
  is_active: z.string().optional(),
})

const toData = (f: z.output<typeof form>) => ({
  name: f.name,
  expense_category_id: parseInt(f.expense_category_id),
  payment_method_id: f.payment_method_id ? parseInt(f.payment_method_id) : null,
  description_pattern: f.description_pattern,
  is_active: f.is_active === '1' ? 1 : 0,
})

type Page = { title: string; submitLabel: string; actionUrl: (c: Context) => string }

const renderForm = async (c: Context, page: Page, data?: ExpenseCheckTemplateFormData) => {
  const [categories, paymentMethods] = await Promise.all([
    fetchSimpleList({ db: c.env.DB, table: 'expense_category', orders: 'name' }),
    fetchSimpleList({ db: c.env.DB, table: 'payment_method', orders: 'name' }),
  ])
  return c.render(
    <ExpenseCheckTemplateForm
      title={page.title}
      actionUrl={page.actionUrl(c)}
      submitLabel={page.submitLabel}
      data={data}
      categories={categories.contents}
      paymentMethods={paymentMethods.contents}
    />,
    { title: page.title }
  )
}

/** 入力エラーは、入力値とエラーを入れてフォームを再表示する */
const validator = (page: Page) =>
  zValidator('form', form, async (result, c) => {
    if (!result.success) {
      return renderForm(c, page, {
        ...(result.data as ExpenseCheckTemplateFormData),
        error: z.flattenError(result.error).fieldErrors,
      })
    }
  })

const createPage: Page = {
  title: 'チェックテンプレート新規追加',
  submitLabel: '作成',
  actionUrl: () => `${listUrl}/create`,
}

export const create = {
  GET: createRoute((c) => renderForm(c, createPage)),
  POST: createRoute(validator(createPage), async (c) => {
    try {
      await createItem({ db: c.env.DB, table, data: toData(c.req.valid('form')) })
      setFlash(c, 'success', 'チェックテンプレート追加に成功しました')
    } catch (err) {
      console.error(`${table} create error:`, err)
      setFlash(c, 'danger', 'チェックテンプレート追加に失敗しました。')
    }
    return c.redirect(listUrl, 303)
  }),
}

const updatePage: Page = {
  title: 'チェックテンプレート編集',
  submitLabel: '更新',
  actionUrl: (c) => `${listUrl}/${c.req.param('id')}/update`,
}

export const update = {
  GET: createRoute(async (c) => {
    const detail = await fetchDetail({ db: c.env.DB, table, id: c.req.param('id')! })
    if (!detail) return c.redirect(listUrl, 303)
    return renderForm(c, updatePage, {
      name: detail.name,
      expense_category_id: String(detail.expense_category_id),
      payment_method_id: detail.payment_method_id ? String(detail.payment_method_id) : '',
      description_pattern: detail.description_pattern,
      is_active: String(detail.is_active),
    })
  }),
  POST: createRoute(validator(updatePage), async (c) => {
    try {
      await updateItem({
        db: c.env.DB,
        table,
        id: c.req.param('id')!,
        data: toData(c.req.valid('form')),
      })
      setFlash(c, 'success', 'チェックテンプレートの編集に成功しました')
    } catch (err) {
      console.error(`${table} update error:`, err)
      setFlash(c, 'danger', 'チェックテンプレート編集に失敗しました。')
    }
    return c.redirect(listUrl, 303)
  }),
}
