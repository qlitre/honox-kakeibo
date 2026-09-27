import { createRoute } from 'honox/factory'
import { fetchAll, fetchListWithFilter, fetchSimpleList } from '@/libs/dbService'
import { AssetPieChart } from '@/components/chart/AssetPieChart'
import { AssetBarChart } from '@/components/chart/AssetBarChart'
import {
  getPrevMonthYear,
  getPrevMonth,
  getBeginningOfMonth,
  getEndOfMonth,
  getAnnualStartYear,
  formatDiff,
} from '@/utils/dashboardUtils'
import { buildAssetSummary, buildColorMap } from '@/utils/dashboardAggregates'
import { annualStartMonth } from '@/settings/kakeiboSettings'
import { PageHeader } from '@/components/PageHeader'
import { MonthPager } from '@/components/MonthPager'
import { Card } from '@/components/share/Card'
import { CardWithHeading } from '@/components/share/CardWithHeading'
import { AssetTable } from '@/components/AssetTable'

export default createRoute(async (c) => {
  const db = c.env.DB
  const year = parseInt(c.req.param('year')!)
  const month = parseInt(c.req.param('month')!)

  // その月に登録された資産（カテゴリごとに月1件）
  const assetsOf = async (y: number, m: number) => {
    const { contents } = await fetchListWithFilter({
      db,
      table: 'asset',
      filters: [
        { field: 'date', op: 'gte', value: getBeginningOfMonth(y, m) },
        { field: 'date', op: 'lte', value: getEndOfMonth(y, m) },
      ],
      limit: 100,
      offset: 0,
    })
    return contents
  }

  const [assets, prevAssets, annualStartAssets, allAssets, categories] = await Promise.all([
    assetsOf(year, month),
    assetsOf(getPrevMonthYear(year, month), getPrevMonth(month)),
    assetsOf(getAnnualStartYear(year, month), annualStartMonth),
    fetchAll({ db, table: 'asset' }),
    fetchSimpleList({ db, table: 'asset_category', orders: 'updated_at' }),
  ])

  const {
    tableItems,
    totalAmount,
    prevTotalDiff,
    prevTotalDiffRatio,
    annualTotalDiff,
    annualTotalDiffRatio,
  } = buildAssetSummary(assets, prevAssets, annualStartAssets)
  const colormap = buildColorMap(categories.contents)
  const prevDiffFmt = formatDiff(prevTotalDiffRatio)
  const annualDiffFmt = formatDiff(annualTotalDiffRatio)

  return c.render(
    <div className='space-y-6'>
      <PageHeader title='資産ダッシュボード'></PageHeader>
      <MonthPager year={year} month={month} hrefSuffix='asset'></MonthPager>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <CardWithHeading heading='総資産'>
          <span className='text-gray-900'>¥{totalAmount.toLocaleString()}</span>
        </CardWithHeading>
        <CardWithHeading heading='前月比'>
          <div className={`flex flex-col ${prevDiffFmt.color}`}>
            <span>
              {prevDiffFmt.sign}¥{Math.abs(prevTotalDiff).toLocaleString()}
            </span>
            <span className='text-base font-medium'>
              {prevDiffFmt.sign}
              {(Math.abs(prevTotalDiffRatio) * 100).toFixed(2)}%
            </span>
          </div>
        </CardWithHeading>
        <CardWithHeading heading='年初比'>
          <div className={`flex flex-col ${annualDiffFmt.color}`}>
            <span>
              {annualDiffFmt.sign}¥{Math.abs(annualTotalDiff).toLocaleString()}
            </span>
            <span className='text-base font-medium'>
              {annualDiffFmt.sign}
              {(Math.abs(annualTotalDiffRatio) * 100).toFixed(2)}%
            </span>
          </div>
        </CardWithHeading>
      </div>

      <section className='space-y-3'>
        <h3 className='text-lg font-semibold text-gray-800 px-1'>資産内訳</h3>
        <div className='grid lg:grid-cols-3 gap-4'>
          <Card className='lg:col-span-2'>
            <AssetTable
              totalAmount={totalAmount}
              prevTotalDiff={prevTotalDiff}
              annualTotalDiff={annualTotalDiff}
              prevTotalDiffRatio={prevTotalDiffRatio}
              annualTotalDiffRatio={annualTotalDiffRatio}
              tableItems={tableItems}
            />
          </Card>
          <Card>
            <div className='w-full'>
              <AssetPieChart assets={assets} colorMap={colormap}></AssetPieChart>
            </div>
          </Card>
        </div>
      </section>

      <section className='space-y-3'>
        <h3 className='text-lg font-semibold text-gray-800 px-1'>資産推移</h3>
        <Card>
          <AssetBarChart assets={allAssets} categories={categories.contents} colorMap={colormap} />
        </Card>
      </section>
    </div>,
    { title: '資産ダッシュボード' }
  )
})
