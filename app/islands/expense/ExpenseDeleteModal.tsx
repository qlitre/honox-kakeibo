import type { FC } from 'hono/jsx'
import type { ExpenseWithDetails } from '@/@types/dbTypes'
import { useState } from 'hono/jsx'
import { Button } from '@/islands/Button'
import { ModalSheet } from '@/components/share/ModalSheet'
import { formCancelClass, formDangerClass } from '@/components/share/formClasses'

type Props = {
  actionUrl: string
  expense: ExpenseWithDetails
}

export const ExpenseDeleteModal: FC<Props> = ({ actionUrl, expense }) => {
  const [open, setOpen] = useState(false)
  const handleClick = () => {
    setOpen(true)
  }
  return (
    <>
      <Button type='danger' onClick={handleClick}>
        削除
      </Button>
      {open && (
        <ModalSheet title='支出削除' onClose={() => setOpen(false)}>
          <form action={actionUrl} method='post' className='space-y-4'>
            <div className='space-y-2 text-base text-gray-800'>
              <p>
                <strong>詳細：</strong> {expense.description || '説明なし'}
              </p>
              <p>
                <strong>カテゴリ：</strong> {expense.category_name}
              </p>
              <p>
                <strong>支払い方法：</strong> {expense.payment_method_name}
              </p>
              <p className='font-semibold'>
                <strong>金額：</strong> {expense.amount}円
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
