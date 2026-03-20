import { z } from "zod";

export const PaymentMethodSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreatePaymentMethodSchema = z.object({
  name: z.string(),
});

export const UpdatePaymentMethodSchema = z.object({
  name: z.string(),
});
