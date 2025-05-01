import type {
  SummaryResponse,
  IncomeCategoryResponse,
  ExpenseCategoryResponse,
} from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { KakeiboClient } from "@/libs/kakeiboClient";
import { BalanceTransitionChart } from "@/islands/chart/BalanceTransitionChart";
import { Card } from "@/components/share/Card";
import { BalanceTransitionForm } from "@/islands/BalanceTransitionForm";

export default createRoute(async (c) => {
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: new URL(c.req.url).origin,
  });
  const incomeData = await client.getSummaryResponse<SummaryResponse>({
    endpoint: "income",
    queries: {
      groupby: "year_month, category_name",
      orders: "year_month",
    },
  });

  const incomeCategoryId = c.req.query("income_category") ?? "";
  const expenseCategoryId = c.req.query("expense_category") ?? "";

  const expenseData = await client.getSummaryResponse<SummaryResponse>({
    endpoint: "expense",
    queries: {
      groupby: "year_month, category_name",
      orders: "year_month",
    },
  });
  const mySet = new Set<string>();
  const objIncomeAmounts: Record<string, number> = {};
  for (const elm of incomeData.summary) {
    const yearMonth = elm.year_month;
    mySet.add(yearMonth);
    if (!objIncomeAmounts[yearMonth]) objIncomeAmounts[yearMonth] = 0;
    if (incomeCategoryId.length > 0) {
      if (String(elm.category_id) == incomeCategoryId) {
        objIncomeAmounts[yearMonth] += elm.total_amount;
      }
    } else {
      objIncomeAmounts[yearMonth] += elm.total_amount;
    }
  }
  const objExpenseAmounts: Record<string, number> = {};
  for (const elm of expenseData.summary) {
    const yearMonth = elm.year_month;
    mySet.add(yearMonth);
    if (!objExpenseAmounts[yearMonth]) objExpenseAmounts[yearMonth] = 0;
    if (expenseCategoryId.length > 0) {
      if (String(elm.category_id) == expenseCategoryId) {
        objExpenseAmounts[yearMonth] += elm.total_amount;
      }
    } else {
      objExpenseAmounts[yearMonth] += elm.total_amount;
    }
  }
  const labels: string[] = Array.from(mySet);
  labels.sort((a, b) => a.localeCompare(b));
  const incomeAmounts = [];
  const expenseAmounts = [];
  for (const yearMonth of labels) {
    const income = objIncomeAmounts[yearMonth] ?? 0;
    const expense = objExpenseAmounts[yearMonth] ?? 0;
    incomeAmounts.push(income);
    expenseAmounts.push(expense);
  }
  const incomeCategoryResponse =
    await client.getListResponse<IncomeCategoryResponse>({
      endpoint: "income_category",
    });
  const expenseCategoryResponse =
    await client.getListResponse<ExpenseCategoryResponse>({
      endpoint: "expense_category",
    });
  return c.render(
    <>
      <BalanceTransitionForm
        incomeDefaultValue={incomeCategoryId}
        incomeCategories={incomeCategoryResponse.contents}
        expenseDefaultValue={expenseCategoryId}
        expenseCategories={expenseCategoryResponse.contents}
      ></BalanceTransitionForm>
      <Card>
        <BalanceTransitionChart
          labels={labels}
          incomeAmounts={incomeAmounts}
          expenseAmounts={expenseAmounts}
        />
      </Card>
    </>,
  );
});
