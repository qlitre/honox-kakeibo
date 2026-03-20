import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  PaymentMethodSchema,
  CreatePaymentMethodSchema,
  UpdatePaymentMethodSchema,
} from "@/api/schemas/payment_method";

export const paymentMethodRoutes = createCrudRoutes({
  tableName: "payment_method",
  tag: "PaymentMethod",
  entitySchema: PaymentMethodSchema,
  createSchema: CreatePaymentMethodSchema,
  updateSchema: UpdatePaymentMethodSchema,
});
