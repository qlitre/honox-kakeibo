import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  ExpenseSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  ExpenseSummarySchema,
} from "@/api/schemas/expense";

export const expenseRoutes = createCrudRoutes({
  tableName: "expense",
  tag: "Expense",
  entitySchema: ExpenseSchema,
  createSchema: CreateExpenseSchema,
  updateSchema: UpdateExpenseSchema,
  summarySchema: ExpenseSummarySchema,
});
