import { z } from "zod";

export const ExpenseCheckTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  expense_category_id: z.number(),
  description_pattern: z.string(),
  is_active: z.number(),
  category_name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateExpenseCheckTemplateSchema = z.object({
  name: z.string(),
  expense_category_id: z.number(),
  description_pattern: z.string(),
  is_active: z.number().optional(),
});

export const UpdateExpenseCheckTemplateSchema = z.object({
  name: z.string(),
  expense_category_id: z.number(),
  description_pattern: z.string(),
  is_active: z.number().optional(),
});
