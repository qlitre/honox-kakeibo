import { z } from "zod";

export const IncomeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateIncomeCategorySchema = z.object({
  name: z.string(),
});

export const UpdateIncomeCategorySchema = z.object({
  name: z.string(),
});
