import type { Context } from 'hono'
import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import {
  createItem,
  deleteItem,
  fetchDetail,
  fetchSimpleList,
  isForeignKeyConstraintError,
  updateItem,
} from '@/libs/dbService'
import { getFlash, setFlash } from '@/libs/flash'
import { CategoryList } from '@/components/share/CategoryList'
import { CategoryCreateForm } from '@/components/share/CategoryCreateForm'
import { CategoryDeleteForm } from '@/components/share/CategoryDeleteForm'

type MasterTable = 'expense_category' | 'income_category' | 'asset_category' | 'payment_method'

type MasterConfig = {
  table: MasterTable
  /** 画面・メッセージ用の名前（例: 支出カテゴリ） */
  label: string
  /** 「投資用」フラグを持つ（資産カテゴリ） */
  investmentFlag?: boolean
}

// チェックボックスはチェック時だけ is_investment=1 が送られる
const form = z.object({
  name: z.string().min(1),
  is_investment: z.enum(['1']).optional(),
})
type Form = { name?: string; is_investment?: string }

/** マスタ（カテゴリ・支払方法）の 一覧 / 追加 / 編集 / 削除 */
export const masterRoutes = ({ table, label, investmentFlag = false }: MasterConfig) => {
  const listUrl = `/auth/${table}`
  const toData = (f: z.output<typeof form>) =>
    investmentFlag
      ? { name: f.name, is_investment: f.is_investment === '1' ? 1 : 0 }
      : { name: f.name }

  const renderForm = (
    c: Context,
    title: string,
    actionUrl: string,
    data?: Form & { error?: Record<string, string[] | undefined> }
  ) =>
    c.render(
      <CategoryCreateForm
        data={data && { ...data, name: data.name ?? '' }}
        title={title}
        actionUrl={actionUrl}
        backUrl={listUrl}
        showInvestment={investmentFlag}
      />,
      { title }
    )

  /** 入力エラーはフォームを再表示する */
  const validator = (title: string, actionUrl: (c: Context) => string) =>
    zValidator('form', form, (result, c) => {
      if (!result.success) {
        const { name, is_investment } = result.data as Form
        return renderForm(c, title, actionUrl(c), {
          name,
          is_investment,
          error: z.flattenError(result.error).fieldErrors,
        })
      }
    })

  const index = createRoute(async (c) => {
    const title = `${label}一覧`
    const { contents } = await fetchSimpleList({ db: c.env.DB, table })
    return c.render(
      <CategoryList flash={getFlash(c)} categories={contents} pageTitle={title} endpoint={table} />,
      { title }
    )
  })

  const createTitle = `${label}追加`
  const createUrl = () => `/auth/${table}/create`
  const create = {
    GET: createRoute((c) => renderForm(c, createTitle, createUrl())),
    POST: createRoute(validator(createTitle, createUrl), async (c) => {
      await createItem({ db: c.env.DB, table, data: toData(c.req.valid('form')) })
      setFlash(c, 'success', `${label}追加に成功しました`)
      return c.redirect(listUrl, 303)
    }),
  }

  const updateTitle = `${label}編集`
  const updateUrl = (c: Context) => `/auth/${table}/${c.req.param('id')}/update`
  const update = {
    GET: createRoute(async (c) => {
      const detail = await fetchDetail({ db: c.env.DB, table, id: c.req.param('id')! })
      if (!detail) return c.redirect(listUrl, 303)
      const is_investment = 'is_investment' in detail && detail.is_investment === 1 ? '1' : '0'
      return renderForm(c, updateTitle, updateUrl(c), { name: detail.name, is_investment })
    }),
    POST: createRoute(validator(updateTitle, updateUrl), async (c) => {
      try {
        await updateItem({
          db: c.env.DB,
          table,
          id: c.req.param('id')!,
          data: toData(c.req.valid('form')),
        })
      } catch (err) {
        console.error(`${table} update error:`, err)
        setFlash(c, 'danger', `${label}の編集に失敗しました。`)
        return c.redirect(listUrl, 303)
      }
      setFlash(c, 'success', `${label}の編集に成功しました`)
      return c.redirect(listUrl, 303)
    }),
  }

  const deleteTitle = `${label}削除`
  const remove = {
    GET: createRoute(async (c) => {
      const detail = await fetchDetail({ db: c.env.DB, table, id: c.req.param('id')! })
      if (!detail) return c.redirect(listUrl, 303)
      return c.render(<CategoryDeleteForm title={deleteTitle} detail={detail} endPoint={table} />, {
        title: deleteTitle,
      })
    }),
    POST: createRoute(async (c) => {
      try {
        await deleteItem({ db: c.env.DB, table, id: c.req.param('id')! })
      } catch (err) {
        // 明細から参照されている場合は外部キー制約で削除できない
        if (!isForeignKeyConstraintError(err)) throw err
        setFlash(
          c,
          'danger',
          `この${label}は明細で使われているため削除できません。先に明細を変更してください。`
        )
        return c.redirect(listUrl, 303)
      }
      setFlash(c, 'success', `${label}の削除に成功しました`)
      return c.redirect(listUrl, 303)
    }),
  }

  return { index, create, update, delete: remove }
}
