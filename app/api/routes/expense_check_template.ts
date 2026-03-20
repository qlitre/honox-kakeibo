import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  ExpenseCheckTemplateSchema,
  CreateExpenseCheckTemplateSchema,
  UpdateExpenseCheckTemplateSchema,
} from "@/api/schemas/expense_check_template";

export const expenseCheckTemplateRoutes = createCrudRoutes({
  tableName: "expense_check_template",
  tag: "ExpenseCheckTemplate",
  entitySchema: ExpenseCheckTemplateSchema,
  createSchema: CreateExpenseCheckTemplateSchema,
  updateSchema: UpdateExpenseCheckTemplateSchema,
});
