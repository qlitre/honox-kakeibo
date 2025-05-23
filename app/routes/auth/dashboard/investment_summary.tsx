import type { SummaryItem } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { InvestmentSummaryChart } from "@/islands/chart/InvestmentSummaryChart";
import { fetchSummary } from "@/libs/dbService";
import {
  accumulate,
  getNextMonth,
  getNextMonthYear,
} from "@/utils/dashboardUtils";
import { CardWithHeading } from "@/components/share/CardWithHeading";
import { Card } from "@/components/share/Card";

export default createRoute(async (c) => {
  const db = c.env.DB;

  const holdingValueData = await fetchSummary<SummaryItem>({
    db,
    table: "asset",
    filters: "is_investment[eq]1",
    groupBy: "year_month, is_investment, category_name",
    orderRaw: "year_month ASC",
  });

  const mySet = new Set<string>();
  const objHoldingValues: Record<string, number> = {};
  for (const elm of holdingValueData.summary) {
    const yearMonth = elm.year_month;
    if (!objHoldingValues[yearMonth]) objHoldingValues[yearMonth] = 0;
    objHoldingValues[yearMonth] += elm.total_amount;
    mySet.add(yearMonth);
  }
  const labels: string[] = Array.from(mySet);
  labels.sort((a, b) => a.localeCompare(b));
  const investmentData = await fetchSummary<SummaryItem>({
    db: db,
    table: "fund_transaction",
    groupBy: "year_month",
    orders: "date",
  });
  const objInvestmentValues: Record<string, number> = {};
  for (const elm of investmentData.summary) {
    const yearMonth = elm.year_month;
    const [year, month] = yearMonth.split("-").map(Number);
    const nxtYear = getNextMonthYear(year, month);
    const nxtMonth = getNextMonth(month);
    const nxtYearMonth = `${nxtYear}-${String(nxtMonth).padStart(2, "0")}`;
    if (!objInvestmentValues[nxtYearMonth])
      objInvestmentValues[nxtYearMonth] = 0;
    objInvestmentValues[nxtYearMonth] += elm.total_amount;
  }
  const holdingValues = [];
  const investmentValues = [];
  for (const yearMonth of labels) {
    const holdingValue = objHoldingValues[yearMonth] ?? 0;
    const investmentValue = objInvestmentValues[yearMonth] ?? 0;
    holdingValues.push(holdingValue);
    investmentValues.push(investmentValue);
  }
  const acc = accumulate(investmentValues);
  const latestHoldingValue = holdingValues.at(-1) ?? 0;
  const latestInvestmentAmount = acc.at(-1) ?? 0;
  const profit = latestHoldingValue - latestInvestmentAmount;
  const profitRate =
    latestInvestmentAmount > 0 ? (profit / latestInvestmentAmount) * 100 : 0;
  return c.render(
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <CardWithHeading heading="利益">
          ¥{profit.toLocaleString()}
        </CardWithHeading>
        <CardWithHeading heading="利益率">
          {profitRate.toFixed(2)}%
        </CardWithHeading>
        <CardWithHeading heading="保有価額">
          ¥{latestHoldingValue.toLocaleString()}
        </CardWithHeading>
        <CardWithHeading heading="累積投資金額">
          ¥{latestInvestmentAmount.toLocaleString()}
        </CardWithHeading>
      </div>
      <Card>
        <InvestmentSummaryChart
          labels={labels}
          holdingValues={holdingValues}
          investmentAmounts={acc}
        ></InvestmentSummaryChart>
      </Card>
    </>,
  );
});
