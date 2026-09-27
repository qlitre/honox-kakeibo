import { createRoute } from 'honox/factory'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createItem } from '@/libs/dbService'
import { fetchSimpleList } from '@/libs/dbService'

const schema = z.object({
  name: z.string().min(1, '名前は必須です'),
  expense_category_id: z.string().min(1, 'カテゴリは必須です'),
  payment_method_id: z.string().optional(),
  description_pattern: z.string().min(1, '検索パターンは必須です'),
  is_active: z.string().optional(),
})

type FormData = {
  error?: Record<string, string[] | undefined>
  name?: string
  expense_category_id?: string
  payment_method_id?: string
  description_pattern?: string
  is_active?: string
}

interface ExpenseCategory {
  id: number
  name: string
}

interface PaymentMethod {
  id: number
  name: string
}

const CreateForm = ({
  data,
  categories,
  paymentMethods,
}: {
  data?: FormData
  categories: ExpenseCategory[]
  paymentMethods: PaymentMethod[]
}) => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-md mx-auto'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>チェックテンプレート新規追加</h1>

        <form action='/auth/expense_check_template/create' method='post' className='space-y-6'>
          <div>
            <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
              名前
            </label>
            <input
              type='text'
              id='name'
              name='name'
              value={data?.name}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='家賃、電気代など'
            />
            {data?.error?.name && <p className='text-red-500 text-sm mt-1'>{data.error.name[0]}</p>}
          </div>

          <div>
            <label
              htmlFor='expense_category_id'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              カテゴリ
            </label>
            <select
              id='expense_category_id'
              name='expense_category_id'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value=''>選択してください</option>
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={String(category.id)}
                  selected={String(category.id) === data?.expense_category_id}
                >
                  {category.name}
                </option>
              ))}
            </select>
            {data?.error?.expense_category_id && (
              <p className='text-red-500 text-sm mt-1'>{data.error.expense_category_id[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='payment_method_id'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              支払い方法
            </label>
            <select
              id='payment_method_id'
              name='payment_method_id'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            >
              <option value='' selected={!data?.payment_method_id}>
                未指定
              </option>
              {paymentMethods.map((method) => (
                <option
                  key={method.id}
                  value={String(method.id)}
                  selected={String(method.id) === data?.payment_method_id}
                >
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor='description_pattern'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              検索パターン
            </label>
            <input
              type='text'
              id='description_pattern'
              name='description_pattern'
              value={data?.description_pattern}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              placeholder='家賃、電気など（部分一致）'
            />
            {data?.error?.description_pattern && (
              <p className='text-red-500 text-sm mt-1'>{data.error.description_pattern[0]}</p>
            )}
            <p className='text-sm text-gray-500 mt-1'>
              支出の詳細欄でこのパターンを含むかチェックします
            </p>
          </div>

          <div className='flex items-center'>
            <input
              type='checkbox'
              id='is_active'
              name='is_active'
              value='1'
              checked={data?.is_active === '1' || !data}
              className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
            />
            <label htmlFor='is_active' className='ml-2 block text-sm text-gray-900'>
              有効
            </label>
          </div>

          <div className='flex gap-4'>
            <button
              type='submit'
              className='flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors cursor-pointer'
            >
              作成
            </button>
            <a
              href='/auth/expense_check_template'
              className='flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md text-center transition-colors'
            >
              キャンセル
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

/** フォームの選択肢（支出カテゴリ・支払い方法） */
const fetchOptions = async (db: D1Database) => {
  const [categories, paymentMethods] = await Promise.all([
    fetchSimpleList<ExpenseCategory>({ db, table: 'expense_category', orders: 'id' }),
    fetchSimpleList<PaymentMethod>({ db, table: 'payment_method', orders: 'name' }),
  ])
  return { categories: categories.contents, paymentMethods: paymentMethods.contents }
}

export default createRoute(async (c) => {
  const options = await fetchOptions(c.env.DB)
  return c.render(<CreateForm {...options} />, {
    title: 'チェックテンプレート新規追加',
  })
})

export const POST = createRoute(
  zValidator('form', schema, async (result, c) => {
    if (!result.success) {
      const { name, expense_category_id, payment_method_id, description_pattern, is_active } =
        result.data
      return c.render(
        <CreateForm
          data={{
            name,
            expense_category_id,
            payment_method_id,
            description_pattern,
            is_active,
            error: z.flattenError(result.error).fieldErrors,
          }}
          {...await fetchOptions(c.env.DB)}
        />
      )
    }
  }),
  async (c) => {
    const db = c.env.DB
    const { name, expense_category_id, payment_method_id, description_pattern, is_active } =
      c.req.valid('form')

    try {
      await createItem({
        db,
        table: 'expense_check_template',
        data: {
          name,
          expense_category_id: parseInt(expense_category_id),
          payment_method_id: payment_method_id ? parseInt(payment_method_id) : null,
          description_pattern,
          is_active: is_active === '1' ? 1 : 0,
        },
      })

      return c.redirect('/auth/expense_check_template', 303)
    } catch (error) {
      console.error('Error creating template:', error)
      return c.render(
        <div className='container mx-auto px-4 py-8'>
          <div className='text-red-600'>作成に失敗しました</div>
        </div>,
        { title: 'エラー' }
      )
    }
  }
)
