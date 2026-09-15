import type { FC } from 'hono/jsx'
import type { ExpenseCategoryResponse, PaymentMethodResponse } from '@/@types/dbTypes'
import { useState } from 'hono/jsx'
import { Button } from '@/islands/Button'
import { ModalSheet } from '@/components/share/ModalSheet'
import {
  formErrorClass,
  formInputClass,
  formLabelClass,
  formSubmitClass,
} from '@/components/share/formClasses'
import { getTodayDate } from '@/utils/dateUtils'

type Data = {
  date: string
  amount: string
  expense_category_id: string
  payment_method_id: string
  description: string
  error?: Record<string, string[] | undefined>
}

type CreateFormProps = {
  data?: Data
  title: string
  actionUrl: string
  categories: ExpenseCategoryResponse
  payment_methods: PaymentMethodResponse
}

type Props = CreateFormProps & {
  buttonType: 'primary' | 'success'
  buttonTitle: string
}

export const ExpenseCreateModal: FC<Props> = ({
  buttonType,
  buttonTitle,
  data,
  title,
  actionUrl,
  categories,
  payment_methods,
}) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Data>({
    date: data?.date || getTodayDate(),
    amount: data?.amount || '',
    expense_category_id: data?.expense_category_id || '',
    payment_method_id: data?.payment_method_id || '',
    description: data?.description || '',
    error: data?.error,
  })

  const handleClick = () => {
    setOpen(true)
  }

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value } = target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  return (
    <>
      <Button type={buttonType} onClick={handleClick}>
        {buttonTitle}
      </Button>
      {open && (
        <ModalSheet title={title} onClose={() => setOpen(false)}>
          <form action={actionUrl} method='post' className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label htmlFor='date' className={formLabelClass}>
                  日付
                </label>
                <input
                  type='date'
                  id='date'
                  name='date'
                  required
                  className={formInputClass}
                  value={formData.date}
                  onChange={handleChange}
                />
                {formData.error?.date && <p className={formErrorClass}>{formData.error.date}</p>}
              </div>

              <div>
                <label htmlFor='amount' className={formLabelClass}>
                  金額
                </label>
                <input
                  type='number'
                  inputMode='numeric'
                  id='amount'
                  name='amount'
                  required
                  className={formInputClass}
                  value={formData.amount}
                  onChange={handleChange}
                />
                {formData.error?.amount && (
                  <p className={formErrorClass}>{formData.error.amount}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label htmlFor='expense_category_id' className={formLabelClass}>
                  カテゴリ
                </label>
                <select
                  id='expense_category_id'
                  name='expense_category_id'
                  required
                  className={formInputClass}
                  onChange={handleChange}
                >
                  {categories.contents.map((category) => (
                    <option
                      value={String(category.id)}
                      key={category.id}
                      selected={String(category.id) === formData.expense_category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                {formData.error?.expense_category_id && (
                  <p className={formErrorClass}>{formData.error.expense_category_id}</p>
                )}
              </div>

              <div>
                <label htmlFor='payment_method_id' className={formLabelClass}>
                  支払い方法
                </label>
                <select
                  id='payment_method_id'
                  name='payment_method_id'
                  required
                  className={formInputClass}
                  onChange={handleChange}
                >
                  {payment_methods.contents.map((method) => (
                    <option
                      value={String(method.id)}
                      key={method.id}
                      selected={String(method.id) === formData.payment_method_id}
                    >
                      {method.name}
                    </option>
                  ))}
                </select>
                {formData.error?.payment_method_id && (
                  <p className={formErrorClass}>{formData.error.payment_method_id}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor='description' className={formLabelClass}>
                説明
              </label>
              <textarea
                id='description'
                name='description'
                rows={2}
                className={formInputClass}
                value={formData.description}
                onChange={handleChange}
              ></textarea>
              {formData.error?.description && (
                <p className={formErrorClass}>{formData.error.description}</p>
              )}
            </div>

            <div>
              <button type='submit' className={formSubmitClass}>
                送信
              </button>
            </div>
          </form>
        </ModalSheet>
      )}
    </>
  )
}
