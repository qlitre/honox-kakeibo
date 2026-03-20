import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  ExpenseCategorySchema,
  CreateExpenseCategorySchema,
  UpdateExpenseCategorySchema,
} from "@/api/schemas/expense_category";

export const expenseCategoryRoutes = createCrudRoutes({
  tableName: "expense_category",
  tag: "ExpenseCategory",
  entitySchema: ExpenseCategorySchema,
  createSchema: CreateExpenseCategorySchema,
  updateSchema: UpdateExpenseCategorySchema,
});
