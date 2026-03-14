import { createRoute } from "honox/factory";
import { PageHeader } from "@/components/PageHeader";
import { MonthPager } from "@/components/MonthPager";
import { Card } from "@/components/share/Card";
import { ExpenseCalendar } from "@/components/ExpenseCalendar";
import {
  getBeginningOfMonth,
  getEndOfMonth,
} from "@/utils/dashboardUtils";

type DailyExpense = {
  date: string;
  total_amount: number;
};

export default createRoute(async (c) => {
  const db = c.env.DB;
  const year = parseInt(c.req.param("year")!);
  const month = parseInt(c.req.param("month")!);

  const startDate = getBeginningOfMonth(year, month);
  const endDate = getEndOfMonth(year, month);

  const sql = `
    SELECT date, SUM(amount) AS total_amount
    FROM expense
    WHERE date >= ? AND date <= ?
    GROUP BY date
  `;

  const { results } = await db
    .prepare(sql)
    .bind(startDate, endDate)
    .all<DailyExpense>();

  const dailyExpenses: Record<string, number> = {};
  for (const row of results) {
    dailyExpenses[row.date] = row.total_amount;
  }

  return c.render(
    <div>
      <PageHeader title="支出カレンダー" />
      <MonthPager year={year} month={month} hrefSuffix="expense_calendar" />
      <Card>
        <ExpenseCalendar
          year={year}
          month={month}
          dailyExpenses={dailyExpenses}
        />
      </Card>
    </div>,
    { title: "支出カレンダー" },
  );
});
