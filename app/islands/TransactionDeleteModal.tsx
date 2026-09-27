import type { FC } from 'hono/jsx'
import { useState } from 'hono/jsx'
import { Button } from '@/islands/Button'
import { ModalSheet } from '@/components/share/ModalSheet'
import { formCancelClass, formDangerClass } from '@/components/share/formClasses'

type Props = {
  title: string
  actionUrl: string
  /** 金額の上に並べる項目（詳細・カテゴリなど） */
  details: { label: string; value: string }[]
  amount: number
}

/** 明細の削除確認 */
export const TransactionDeleteModal: FC<Props> = ({ title, actionUrl, details, amount }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type='danger' onClick={() => setOpen(true)}>
        削除
      </Button>
      {open && (
        <ModalSheet title={title} onClose={() => setOpen(false)}>
          <form action={actionUrl} method='post' className='space-y-4'>
            <div className='space-y-2 text-base text-gray-800'>
              {details.map(({ label, value }) => (
                <p key={label}>
                  <strong>{label}：</strong> {value}
                </p>
              ))}
              <p className='font-semibold'>
                <strong>金額：</strong> {amount}円
              </p>
            </div>
            <p className='text-sm text-gray-500'>削除すると元に戻せません。本当に削除しますか？</p>
            <div className='flex gap-3'>
              <button type='button' onClick={() => setOpen(false)} className={formCancelClass}>
                キャンセル
              </button>
              <button type='submit' className={formDangerClass}>
                削除する
              </button>
            </div>
          </form>
        </ModalSheet>
      )}
    </>
  )
}
