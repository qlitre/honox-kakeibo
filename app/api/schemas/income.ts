import { z } from "zod";

export const IncomeSchema = z.object({
  id: z.number(),
  date: z.string(),
  amount: z.number(),
  income_category_id: z.number(),
  category_name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateIncomeSchema = z.object({
  date: z.string(),
  amount: z.number(),
  income_category_id: z.number(),
  description: z.string().nullable().optional(),
});

export const UpdateIncomeSchema = z.object({
  date: z.string(),
  amount: z.number(),
  income_category_id: z.number(),
  description: z.string().nullable().optional(),
});

export const IncomeSummarySchema = z.object({
  total_amount: z.number(),
  year_month: z.string(),
  category_id: z.number().optional(),
  category_name: z.string().optional(),
});
