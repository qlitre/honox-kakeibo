import type { ExpenseCategory, SummaryItem } from "@/@types/dbTypes";
import type { ExpenseTableItems } from "@/@types/common";
import type { TableHeaderItem } from "@/@types/common";
import { createRoute } from "honox/factory";
import { fetchSummary, fetchSimpleList } from "@/libs/dbService";
import {
  formatDiff,
  getPrevMonthYear,
  getPrevMonth,
} from "@/utils/dashboardUtils";
import { PageHeader } from "@/components/PageHeader";
import { MonthPager } from "@/components/MonthPager";
import { colorSchema } from "@/settings/kakeiboSettings";
import { Card } from "@/components/share/Card";
import { CardWithHeading } from "@/components/share/CardWithHeading";
import { Table } from "@/components/share/Table";
import { ExpensePieChart } from "@/islands/chart/ExpensePieChart";

const getTotal = (items: SummaryItem[]) => {
  let ret = 0;
  for (const elm of items) {
    ret += elm.total_amount;
  }
  return ret;
};

const getYearMonth = (year: number, month: number) => {
  return `${year}-${month.toString().padStart(2, "0")}`;
};

export default createRoute(async (c) => {
  const db = c.env.DB;
  const year = parseInt(c.req.param("year"));
  const month = parseInt(c.req.param("month"));
  const prevMonth = getPrevMonth(month);
  const prevYear = getPrevMonthYear(year, month);
  const yearMonth = getYearMonth(year, month);
  const prevYearMonth = getYearMonth(prevYear, prevMonth);
  const expenseValueData = await fetchSummary<SummaryItem>({
    db: db,
    table: "expense",
    filters: `year_month[eq]${yearMonth}`,
    groupBy: "year_month, category_name",
    orderRaw: "year_month ASC",
  });
  const prevExpenseValueData = await fetchSummary<SummaryItem>({
    db: db,
    table: "expense",
    filters: `year_month[eq]${prevYearMonth}`,
    groupBy: "year_month, category_name",
    orderRaw: "year_month ASC",
  });

  const categories = await fetchSimpleList<ExpenseCategory>({
    db,
    table: "expense_category",
  });

  const tableItems: ExpenseTableItems = {};
  // 一回ゼロで初期化
  for (const elm of categories.contents) {
    tableItems[elm.id] = {
      categoryName: elm.name,
      now: 0,
      prevDiff: 0,
    };
  }
  // 今月の金額を記録
  for (const elm of expenseValueData.summary) {
    tableItems[elm.category_id] = {
      ...tableItems[elm.category_id],
      now: elm.total_amount,
      prevDiff: elm.total_amount,
    };
  }
  // 前月の金額と差分を記録
  for (const elm of prevExpenseValueData.summary) {
    const item = tableItems[elm.category_id];
    tableItems[elm.category_id] = {
      ...tableItems[elm.category_id],
      prevDiff: item.now - elm.total_amount,
    };
  }

  const incomeValueData = await fetchSummary<SummaryItem>({
    db: db,
    table: "income",
    filters: `year_month[eq]${yearMonth}`,
    groupBy: "year_month, category_name",
    orderRaw: "year_month ASC",
  });

  const expenseTotal = getTotal(expenseValueData.summary);
  const incomeTotal = getTotal(incomeValueData.summary);
  const prevExpenseTotal = getTotal(prevExpenseValueData.summary);
  const prevTotalDiff = expenseTotal - prevExpenseTotal;
  const prevTotalDiffSign = formatDiff(prevTotalDiff).sign;
  const prevTotalDiffColor = formatDiff(-1 * prevTotalDiff).color;

  const colormap: Record<number, string> = {};
  for (let i = 0; i < categories.contents.length; i++) {
    const categoryId = categories.contents[i].id;
    const color = colorSchema[i];
    colormap[categoryId] = color;
  }
  const balance = incomeTotal - expenseTotal;
  const diff = formatDiff(incomeTotal - expenseTotal);
  const hearders: TableHeaderItem[] = [
    { name: "カテゴリ", textPosition: "left" },
    { name: "金額", textPosition: "right" },
    { name: "前月比", textPosition: "right" },
    { name: "割合", textPosition: "right" },
  ];
  return c.render(
    <div>
      <PageHeader title="月間収支"></PageHeader>
      <MonthPager
        year={year}
        month={month}
        hrefSuffix="monthly_balance"
      ></MonthPager>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
        <CardWithHeading heading="収支">
          <span className={diff.color}>
            {diff.sign}
            {Math.abs(balance).toLocaleString()}
          </span>
        </CardWithHeading>
        <CardWithHeading heading="支出合計">
          {expenseTotal.toLocaleString()}
        </CardWithHeading>
        <CardWithHeading heading="収入合計">
          {incomeTotal.toLocaleString()}
        </CardWithHeading>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <Table headers={hearders}>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.values(tableItems).map((item, index) => {
                const prevDiffSign = formatDiff(item.prevDiff).sign;
                // プラスの時に赤にさせたいため
                const prevDiffColor = formatDiff(-1 * item.prevDiff).color;
                return (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-4 text-left">{item.categoryName}</td>
                    <td className="px-4 py-4 text-right">
                      {item.now.toLocaleString()}
                    </td>
                    <td className={`px-4 py-4 ${prevDiffColor} text-right`}>
                      {prevDiffSign}
                      {Math.abs(item.prevDiff).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {((item.now / expenseTotal) * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
              <tfoot className="bg-gray-100">
                <tr className="font-semibold">
                  <td className="px-4 py-4 text-left">合計</td>
                  <td className="px-4 py-4 text-right">
                    {expenseTotal.toLocaleString()}
                  </td>
                  <td className={`px-4 py-4 ${prevTotalDiffColor} text-right`}>
                    {prevTotalDiffSign}
                    {Math.abs(prevTotalDiff).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right">100.00%</td>
                </tr>
              </tfoot>
            </tbody>
          </Table>
        </Card>
        <Card className="w-full">
          <ExpensePieChart
            items={expenseValueData.summary}
            colorMap={colormap}
          />
        </Card>
      </div>
    </div>,
    { title: "月間収支" }
  );
});
