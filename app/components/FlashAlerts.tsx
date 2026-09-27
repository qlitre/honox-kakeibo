import type { FC } from 'hono/jsx'
import { Alert } from '@/islands/share/Alert'

/** getFlash で読んだアラートを表示する */
export const FlashAlerts: FC<{ success?: string; danger?: string }> = ({ success, danger }) => (
  <>
    {success && <Alert message={success} type='success' />}
    {danger && <Alert message={danger} type='danger' />}
  </>
)
