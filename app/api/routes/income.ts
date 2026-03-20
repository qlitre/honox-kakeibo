import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  IncomeSchema,
  CreateIncomeSchema,
  UpdateIncomeSchema,
  IncomeSummarySchema,
} from "@/api/schemas/income";

export const incomeRoutes = createCrudRoutes({
  tableName: "income",
  tag: "Income",
  entitySchema: IncomeSchema,
  createSchema: CreateIncomeSchema,
  updateSchema: UpdateIncomeSchema,
  summarySchema: IncomeSummarySchema,
});
