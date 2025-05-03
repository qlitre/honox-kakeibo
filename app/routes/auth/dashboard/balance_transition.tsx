// app/routes/auth/balance/transition.tsx
import type {
  SummaryItem,
  IncomeCategory,
  ExpenseCategory,
} from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { BalanceTransitionChart } from "@/islands/chart/BalanceTransitionChart";
import { Card } from "@/components/share/Card";
import { BalanceTransitionForm } from "@/islands/BalanceTransitionForm";
import { fetchSummary, fetchSimpleList } from "@/libs/dbService";

export default createRoute(async (c) => {
  const db = c.env.DB;

  /* ---------- クエリパラメータ ---------- */
  const incomeCategoryId = c.req.query("income_category") ?? "";
  const expenseCategoryId = c.req.query("expense_category") ?? "";

  /* ---------- サマリー取得 ---------- */
  const incomeData = await fetchSummary<SummaryItem>({
    db,
    table: "income",
    groupBy: "year_month, category_name",
  });

  const expenseData = await fetchSummary<SummaryItem>({
    db,
    table: "expense",
    groupBy: "year_month, category_name",
  });

  /* ---------- 月別集計を組み立て ---------- */
  const months = new Set<string>();
  const incMap: Record<string, number> = {};
  const expMap: Record<string, number> = {};

  for (const row of incomeData.summary) {
    const ym = row.year_month;
    months.add(ym);
    if (!incMap[ym]) incMap[ym] = 0;
    if (!incomeCategoryId || String(row.category_id) === incomeCategoryId) {
      incMap[ym] += row.total_amount;
    }
  }

  for (const row of expenseData.summary) {
    const ym = row.year_month;
    months.add(ym);
    if (!expMap[ym]) expMap[ym] = 0;
    if (!expenseCategoryId || String(row.category_id) === expenseCategoryId) {
      expMap[ym] += row.total_amount;
    }
  }

  const labels = Array.from(months).sort((a, b) => a.localeCompare(b));
  const incomeAmounts = labels.map((m) => incMap[m] ?? 0);
  const expenseAmounts = labels.map((m) => expMap[m] ?? 0);

  /* ---------- カテゴリリスト ---------- */
  const incomeCats = await fetchSimpleList<IncomeCategory>({
    db,
    table: "income_category",
    orders: "updated_at",
  });

  const expenseCats = await fetchSimpleList<ExpenseCategory>({
    db,
    table: "expense_category",
    orders: "updated_at",
  });

  /* ---------- レンダリング ---------- */
  return c.render(
    <>
      <BalanceTransitionForm
        incomeDefaultValue={incomeCategoryId}
        incomeCategories={incomeCats.contents}
        expenseDefaultValue={expenseCategoryId}
        expenseCategories={expenseCats.contents}
      />
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
