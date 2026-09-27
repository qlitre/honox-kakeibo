import { createRoute } from 'honox/factory'
import { InvestmentSummaryChart } from '@/components/chart/InvestmentSummaryChart'
import { fetchSummary } from '@/libs/dbService'
import { buildInvestmentSummary } from '@/utils/dashboardAggregates'
import { CardWithHeading } from '@/components/share/CardWithHeading'
import { Card } from '@/components/share/Card'

export default createRoute(async (c) => {
  const db = c.env.DB

  const [holdings, deposits] = await Promise.all([
    fetchSummary({
      db,
      table: 'asset',
      filters: [{ field: 'is_investment', op: 'eq', value: 1 }],
      groupBy: ['year_month', 'is_investment', 'category_name'],
    }),
    fetchSummary({ db, table: 'fund_transaction', groupBy: ['year_month'] }),
  ])
  const {
    labels,
    holdingValues,
    investmentAmounts,
    latestHoldingValue,
    latestInvestmentAmount,
    profit,
    profitRate,
  } = buildInvestmentSummary(holdings.summary, deposits.summary)

  return c.render(
    <>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4'>
        <CardWithHeading heading='利益'>¥{profit.toLocaleString()}</CardWithHeading>
        <CardWithHeading heading='利益率'>{profitRate.toFixed(2)}%</CardWithHeading>
        <CardWithHeading heading='保有価額'>¥{latestHoldingValue.toLocaleString()}</CardWithHeading>
        <CardWithHeading heading='累積投資金額'>
          ¥{latestInvestmentAmount.toLocaleString()}
        </CardWithHeading>
      </div>
      <Card>
        <InvestmentSummaryChart
          labels={labels}
          holdingValues={holdingValues}
          investmentAmounts={investmentAmounts}
        ></InvestmentSummaryChart>
      </Card>
    </>
  )
})
