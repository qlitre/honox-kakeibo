import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  AssetCategorySchema,
  CreateAssetCategorySchema,
  UpdateAssetCategorySchema,
} from "@/api/schemas/asset_category";

export const assetCategoryRoutes = createCrudRoutes({
  tableName: "asset_category",
  tag: "AssetCategory",
  entitySchema: AssetCategorySchema,
  createSchema: CreateAssetCategorySchema,
  updateSchema: UpdateAssetCategorySchema,
});
