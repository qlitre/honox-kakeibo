import type { SelectField } from '@/islands/TransactionFormModal'

/** マスタの一覧 → セレクトの選択肢 */
export const toOptions = (items: { id: number; name: string }[]): SelectField['options'] =>
  items.map((item) => ({ value: String(item.id), label: item.name }))

/**
 * 明細の行 → フォームの初期値（日付・金額・説明と、セレクトの項目だけ）
 * island の props はHTMLに埋め込まれるので、フォームで使わない値は渡さない
 */
export const toFormValues = (row: Record<string, unknown>, selects: SelectField[] = []) =>
  Object.fromEntries(
    ['date', 'amount', 'description', ...selects.map((s) => s.name)].map((key) => [
      key,
      row[key] == null ? '' : String(row[key]),
    ])
  )
