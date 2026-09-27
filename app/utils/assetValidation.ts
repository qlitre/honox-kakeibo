import { fetchListWithFilter } from '@/libs/dbService'
import { getBeginningOfMonth, getEndOfMonth } from '@/utils/dashboardUtils'

interface AssetCategoryDuplicationCheckParams {
  db: D1Database
  date: string
  assetCategoryId: number
  /** 更新時に自分自身を重複とみなさないためのid */
  excludeId?: number
}

export async function checkAssetCategoryDuplication({
  db,
  date,
  assetCategoryId,
  excludeId,
}: AssetCategoryDuplicationCheckParams): Promise<boolean> {
  const [yearStr, monthStr] = date.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const ge = getBeginningOfMonth(year, month)
  const le = getEndOfMonth(year, month)

  const result = await fetchListWithFilter({
    db,
    table: 'asset',
    filters: [
      { field: 'asset_category_id', op: 'eq', value: assetCategoryId },
      { field: 'date', op: 'gte', value: ge },
      { field: 'date', op: 'lte', value: le },
    ],
    limit: 10,
    offset: 0,
  })

  return result.contents.some((asset) => asset.id !== excludeId)
}
