import type { Child, FC } from 'hono/jsx'
import { useEffect } from 'hono/jsx'

type Props = {
  title: string
  onClose: () => void
  children: Child | Child[]
}

/**
 * モーダルの共通外枠。
 * モバイルでは下から出るボトムシート、sm以上では中央ダイアログ。
 * ヘッダー（タイトル・閉じるボタン）は固定し、本文はまとめてスクロールする。
 */
export const ModalSheet: FC<Props> = ({ title, onClose, children }) => {
  // 開いている間は背面のスクロールを止め、Escで閉じられるようにする
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4'>
      {/* Backdrop */}
      <div className='fixed inset-0 bg-gray-900/50' onClick={onClose}></div>

      {/* Dialog Panel */}
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-sheet-title'
        className='relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white text-left shadow-xl sm:max-w-lg sm:rounded-lg'
      >
        {/* Header */}
        <div className='flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3'>
          <h2 id='modal-sheet-title' className='text-lg font-bold text-gray-900'>
            {title}
          </h2>
          <button
            type='button'
            aria-label='閉じる'
            onClick={onClose}
            className='-mr-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer'
          >
            <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
              <path d='M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z' />
            </svg>
          </button>
        </div>

        {/* Body（ヘッダー以下をスクロール） */}
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
          {children}
        </div>
      </div>
    </div>
  )
}
