import { z } from "zod";

export const AssetCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  is_investment: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAssetCategorySchema = z.object({
  name: z.string(),
  is_investment: z.number().optional(),
});

export const UpdateAssetCategorySchema = z.object({
  name: z.string(),
  is_investment: z.number().optional(),
});
