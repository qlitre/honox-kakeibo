import { createRoute } from 'honox/factory';
import { SummaryResponse } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { InvestmentSummaryChart } from '@/islands/InvestmentSummaryChart';
import { accumulate, getNextMonth, getNextMonthYear } from '@/utils/dashboardUtils';

export default createRoute(async (c) => {
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL });

    const holdingValueData = await client.getSummaryResponse<SummaryResponse>({
        endpoint: 'asset', queries: {
            filters: 'is_investment[eq]1',
            groupby: 'year_month, is_investment, category_name',
            orders: 'year_month'
        }
    });
    const labels = []
    const mySet = new Set()
    const objHoldingValues: Record<string, number> = {}
    for (const elm of holdingValueData.summary) {
        const yearMonth = elm.year_month
        if (!objHoldingValues[yearMonth]) objHoldingValues[yearMonth] = 0
        objHoldingValues[yearMonth] += elm.total_amount
        if (mySet.has(yearMonth)) continue
        mySet.add(yearMonth)
        labels.push(yearMonth)
    }
    const investmentData = await client.getSummaryResponse<SummaryResponse>({
        endpoint: 'fund_transaction',
        queries: {
            groupby: 'year_month',
            orders: 'date'
        }
    })
    const objInvestmentValues: Record<string, number> = {}
    for (const elm of investmentData.summary) {
        const yearMonth = elm.year_month
        const [year, month] = yearMonth.split("-").map(Number);
        const nxtYear = getNextMonthYear(year, month)
        const nxtMonth = getNextMonth(month)
        const nxtYearMonth = `${nxtYear}-${String(nxtMonth).padStart(2, "0")}`
        if (!objInvestmentValues[nxtYearMonth]) objInvestmentValues[nxtYearMonth] = 0
        objInvestmentValues[nxtYearMonth] += elm.total_amount
    }
    const holdingValues = []
    const investmentValues = []
    for (const yearMonth of labels) {
        const holdingValue = objHoldingValues[yearMonth] ?? 0;
        const investmentValue = objInvestmentValues[yearMonth] ?? 0;
        holdingValues.push(holdingValue)
        investmentValues.push(investmentValue)
    }
    const acc = accumulate(investmentValues)

    return c.render(
        <>
            <h1>Income Summary</h1>
            <div>
                <InvestmentSummaryChart labels={labels} holdingValues={holdingValues} investmentAmounts={acc}></InvestmentSummaryChart>
            </div>
        </>
    )
});
