import type { AssetWithCategoryResponse } from "@/@types/dbTypes";
import { fetchListWithFilter } from "@/libs/dbService";
import { getBeginningOfMonth, getEndOfMonth } from "@/utils/dashboardUtils";

export interface AssetCategoryDuplicationCheckParams {
  db: D1Database;
  date: string;
  assetCategoryId: number;
}

export async function checkAssetCategoryDuplication({
  db,
  date,
  assetCategoryId,
}: AssetCategoryDuplicationCheckParams): Promise<boolean> {
  const [yearStr, monthStr] = date.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const ge = getBeginningOfMonth(year, month);
  const le = getEndOfMonth(year, month);

  const filters = `asset_category_id[eq]${assetCategoryId}[and]date[greater_equal]${ge}[and]date[less_equal]${le}`;

  const result = await fetchListWithFilter<AssetWithCategoryResponse>({
    db,
    table: "asset",
    filters,
    limit: 10,
    offset: 0,
  });

  return result.totalCount > 0;
}