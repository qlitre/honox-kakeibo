import type { FC } from 'hono/jsx'
import { useState } from 'hono/jsx'
import { Button } from '@/islands/Button'
import { ModalSheet } from '@/components/share/ModalSheet'
import { formInputClass, formLabelClass, formSubmitClass } from '@/components/share/formClasses'
import { getTodayDate } from '@/utils/dateUtils'

// island の props はシリアライズしてブラウザへ渡すので、関数やJSXではなくデータで受ける
export type SelectField = {
  name: string
  label: string
  options: { value: string; label: string }[]
}

type Props = {
  buttonType: 'primary' | 'success'
  buttonTitle: string
  title: string
  actionUrl: string
  /** 初期値（name → 値）。date が無ければ今日 */
  values?: Record<string, string>
  /** 日付・金額と説明の間に並べるセレクト（2つなら横並び） */
  selects?: SelectField[]
}

/** 明細（支出・収入・資産・入金履歴）の追加・編集・複写フォーム */
export const TransactionFormModal: FC<Props> = ({
  buttonType,
  buttonTitle,
  title,
  actionUrl,
  values = {},
  selects = [],
}) => {
  const [open, setOpen] = useState(false)
  // 閉じて開き直しても入力途中の値を残す
  const [formData, setFormData] = useState<Record<string, string>>({
    date: getTodayDate(),
    amount: '',
    description: '',
    ...values,
  })

  const handleChange = (e: Event) => {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const select = ({ name, label, options }: SelectField) => (
    <div key={name}>
      <label htmlFor={name} className={formLabelClass}>
        {label}
      </label>
      <select id={name} name={name} required className={formInputClass} onChange={handleChange}>
        {options.map((option) => (
          <option
            value={option.value}
            key={option.value}
            selected={option.value === formData[name]}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <>
      <Button type={buttonType} onClick={() => setOpen(true)}>
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
              </div>
            </div>

            {selects.length > 1 ? (
              <div className='grid grid-cols-2 gap-3'>{selects.map(select)}</div>
            ) : (
              selects.map(select)
            )}

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
