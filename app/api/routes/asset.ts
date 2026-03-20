import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  AssetSchema,
  CreateAssetSchema,
  UpdateAssetSchema,
  AssetSummarySchema,
} from "@/api/schemas/asset";

export const assetRoutes = createCrudRoutes({
  tableName: "asset",
  tag: "Asset",
  entitySchema: AssetSchema,
  createSchema: CreateAssetSchema,
  updateSchema: UpdateAssetSchema,
  summarySchema: AssetSummarySchema,
});
