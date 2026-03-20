import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  IncomeCategorySchema,
  CreateIncomeCategorySchema,
  UpdateIncomeCategorySchema,
} from "@/api/schemas/income_category";

export const incomeCategoryRoutes = createCrudRoutes({
  tableName: "income_category",
  tag: "IncomeCategory",
  entitySchema: IncomeCategorySchema,
  createSchema: CreateIncomeCategorySchema,
  updateSchema: UpdateIncomeCategorySchema,
});
