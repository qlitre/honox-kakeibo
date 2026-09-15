import type { FC } from 'hono/jsx'
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
  description: string
  error?: Record<string, string[] | undefined>
}

type CreateFormProps = {
  data?: Data
  title: string
  actionUrl: string
}

type Props = CreateFormProps & {
  buttonType: 'primary' | 'success'
  buttonTitle: string
}

export const FundTransactionCreateModal: FC<Props> = ({
  buttonType,
  buttonTitle,
  data,
  title,
  actionUrl,
}) => {
  const [open, setOpen] = useState(false)
  const handleClick = () => {
    setOpen(true)
  }
  const [formData, setFormData] = useState<Data>({
    date: data?.date || getTodayDate(),
    amount: data?.amount || '',
    description: data?.description || '',
    error: data?.error,
  })

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
