import { z } from "zod";

export const FundTransactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  amount: z.number(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateFundTransactionSchema = z.object({
  date: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
});

export const UpdateFundTransactionSchema = z.object({
  date: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
});

export const FundTransactionSummarySchema = z.object({
  total_amount: z.number(),
  year_month: z.string(),
});
