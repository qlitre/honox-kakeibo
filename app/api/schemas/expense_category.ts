import { z } from "zod";

export const ExpenseCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateExpenseCategorySchema = z.object({
  name: z.string(),
});

export const UpdateExpenseCategorySchema = z.object({
  name: z.string(),
});
