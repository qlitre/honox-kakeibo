import { createRoute } from 'honox/factory';
import { SummaryResponse } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { BalanceTransitionChart } from '@/islands/chart/BalanceTransitionChart';
import { Card } from '@/components/share/Card';

export default createRoute(async (c) => {
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL });
    const incomeData = await client.getSummaryResponse<SummaryResponse>({
        endpoint: 'income', queries: {
            groupby: 'year_month, category_name',
            orders: 'year_month'
        }
    });
    const expenseData = await client.getSummaryResponse<SummaryResponse>({
        endpoint: 'expense', queries: {
            groupby: 'year_month, category_name',
            orders: 'year_month'
        }
    });
    const mySet = new Set<string>()
    const objIncomeAmounts: Record<string, number> = {}
    for (const elm of incomeData.summary) {
        const yearMonth = elm.year_month
        if (!objIncomeAmounts[yearMonth]) objIncomeAmounts[yearMonth] = 0
        objIncomeAmounts[yearMonth] += elm.total_amount
        mySet.add(yearMonth)
    }
    const objExpenseAmounts: Record<string, number> = {}
    for (const elm of expenseData.summary) {
        const yearMonth = elm.year_month
        if (!objExpenseAmounts[yearMonth]) objExpenseAmounts[yearMonth] = 0
        objExpenseAmounts[yearMonth] += elm.total_amount
        mySet.add(yearMonth)
    }
    const labels: string[] = Array.from(mySet);
    labels.sort((a, b) => (a.localeCompare(b)));
    const incomeAmounts = []
    const expenseAmounts = []
    for (const yearMonth of labels) {
        const income = objIncomeAmounts[yearMonth] ?? 0
        const expense = objExpenseAmounts[yearMonth] ?? 0
        incomeAmounts.push(income)
        expenseAmounts.push(expense)
    }
    return c.render(
        <>
            <Card>
                <BalanceTransitionChart labels={labels} incomeAmounts={incomeAmounts} expenseAmounts={expenseAmounts} />
            </Card>
        </>
    )
});
