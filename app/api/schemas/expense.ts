import { z } from "zod";

export const ExpenseSchema = z.object({
  id: z.number(),
  date: z.string(),
  amount: z.number(),
  expense_category_id: z.number(),
  payment_method_id: z.number(),
  description: z.string().nullable(),
  category_name: z.string(),
  payment_method_name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateExpenseSchema = z.object({
  date: z.string(),
  amount: z.number(),
  expense_category_id: z.number(),
  payment_method_id: z.number(),
  description: z.string().nullable().optional(),
});

export const UpdateExpenseSchema = z.object({
  date: z.string(),
  amount: z.number(),
  expense_category_id: z.number(),
  payment_method_id: z.number(),
  description: z.string().nullable().optional(),
});

export const ExpenseSummarySchema = z.object({
  total_amount: z.number(),
  year_month: z.string(),
  category_id: z.number().optional(),
  category_name: z.string().optional(),
  payment_method_name: z.string().optional(),
});
