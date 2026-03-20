import { z } from "zod";

export const AssetSchema = z.object({
  id: z.number(),
  date: z.string(),
  amount: z.number(),
  asset_category_id: z.number(),
  category_name: z.string(),
  is_investment: z.number(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateAssetSchema = z.object({
  date: z.string(),
  amount: z.number(),
  asset_category_id: z.number(),
  description: z.string().nullable().optional(),
});

export const UpdateAssetSchema = z.object({
  date: z.string(),
  amount: z.number(),
  asset_category_id: z.number(),
  description: z.string().nullable().optional(),
});

export const AssetSummarySchema = z.object({
  total_amount: z.number(),
  year_month: z.string(),
  category_id: z.number().optional(),
  category_name: z.string().optional(),
  is_investment: z.number().optional(),
});
