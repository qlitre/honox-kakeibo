import { createRoute } from 'honox/factory';
import type { AssetCategoryResponse, AssetWithCategoryResponse } from '@/@types/dbTypes';
import { KakeiboClient } from '@/libs/kakeiboClient';
import { AssetPieChart } from '@/islands/chart/AssetPieChart';
import { AssetBarChart } from '@/islands/chart/AssetBarChart';
import {
    getPrevMonthYear,
    getPrevMonth,
    getBeginningOfMonth,
    getEndOfMonth,
    getAnnualStartYear,
} from '@/utils/dashboardUtils';
import { annualStartMonth } from '@/settings/kakeiboSettings';
import { PageHeader } from '@/components/PageHeader';
import { MonthPager } from '@/components/MonthPager';
import { colorSchema } from '@/settings/kakeiboSettings';
import { Card } from '@/components/share/Card';
import { AssetTable } from '@/components/AssetTable';
import type { AssetTableItems } from '@/@types/common';


export default createRoute(async (c) => {
    const client = new KakeiboClient({ token: c.env.HONO_IS_COOL, baseUrl: c.env.BASE_URL })
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    const ge = getBeginningOfMonth(year, month)
    const le = getEndOfMonth(year, month)

    // APIからデータを取得
    const asset = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset',
        queries: { limit: 100, filters: `date[greater_equal]${ge}[and]date[less_equal]${le}` }
    });

    // 前月
    const prevYear = getPrevMonthYear(year, month)
    const prevMonth = getPrevMonth(month)
    const prevGe = getBeginningOfMonth(prevYear, prevMonth)
    const prevLe = getEndOfMonth(prevYear, prevMonth)
    const prevAsset = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset',
        queries: { limit: 100, filters: `date[greater_equal]${prevGe}[and]date[less_equal]${prevLe}` }
    });
    // 年初
    const annualStartYear = getAnnualStartYear(year, month)
    const annualStartGe = getBeginningOfMonth(annualStartYear, annualStartMonth)
    const annualStartLe = getEndOfMonth(annualStartYear, annualStartMonth)
    const annualStartAsset = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset',
        queries: { limit: 100, filters: `date[greater_equal]${annualStartGe}[and]date[less_equal]${annualStartLe}` }
    })

    const tableItems: AssetTableItems = {}
    // 当月の記入
    for (const elm of asset.contents) {
        const categoryId = elm.asset_category_id
        tableItems[categoryId] = {
            categoryName: elm.category_name,
            now: elm.amount,
            prevDiff: 0,
            prevDiffRatio: 0,
            annualStartDiff: 0,
            annualStartDiffRatio: 0,
        }
    }
    // 前月の記入
    for (const elm of prevAsset.contents) {
        const categoryId = elm.asset_category_id
        if (categoryId in tableItems) {
            const obj = tableItems[categoryId]
            const diff = obj.now - elm.amount
            obj.prevDiff = diff
            obj.prevDiffRatio = diff / elm.amount
        } else {
            tableItems[categoryId] = {
                categoryName: elm.category_name,
                now: 0,
                prevDiff: -1 * elm.amount,
                prevDiffRatio: -1,
                annualStartDiff: 0,
                annualStartDiffRatio: 0
            }
        }
    }
    // 年初の記入
    for (const elm of annualStartAsset.contents) {
        const categoryId = elm.asset_category_id
        if (categoryId in tableItems) {
            const obj = tableItems[categoryId]
            const diff = obj.now - elm.amount
            obj.annualStartDiff = diff
            obj.annualStartDiffRatio = diff / elm.amount
        } else {
            tableItems[categoryId] = {
                categoryName: elm.category_name,
                now: 0,
                prevDiff: 0,
                prevDiffRatio: 0,
                annualStartDiff: -1 * elm.amount,
                annualStartDiffRatio: -1
            }
        }
    }

    // 合計金額の計算
    const totalAmount = asset.contents.reduce((sum, item) => sum + item.amount, 0);
    const prevTotalAmount = prevAsset.contents.reduce((sum, item) => sum + item.amount, 0);
    const prevTotalDiff = totalAmount - prevTotalAmount
    const prevTotalDiffRatio = prevTotalDiff / prevTotalAmount
    const annualTotalAmount = annualStartAsset.contents.reduce((sum, item) => sum + item.amount, 0);
    const annualTotalDiff = totalAmount - annualTotalAmount
    const annualTotalDiffRatio = annualTotalDiff / annualTotalAmount

    // BarChart用のデータの取得
    const preReq = await client.getListResponse<AssetWithCategoryResponse>({ endpoint: 'asset' })
    const totalCount = preReq.totalCount
    const allAssets = await client.getListResponse<AssetWithCategoryResponse>({
        endpoint: 'asset', queries: {
            limit: totalCount,
            orders: 'date,asset_category_id'
        }
    })
    const categories = await client.getListResponse<AssetCategoryResponse>({
        endpoint: 'asset_category', queries: {
            limit: 100
        }
    })
    const colormap: Record<number, string> = {}
    for (let i = 0; i < categories.contents.length; i++) {
        const categoryId = categories.contents[i].id
        const color = colorSchema[i]
        colormap[categoryId] = color
    }

    return c.render(
        <div>
            <PageHeader title='資産ダッシュボード'></PageHeader>
            <MonthPager year={year} month={month} hrefSuffix='asset'></MonthPager>
            <div className="grid lg:grid-cols-3 gap-4">
                {/* テーブル部分：2 の割合 */}
                <Card className="lg:col-span-2">
                    <AssetTable
                        totalAmount={totalAmount}
                        prevTotalDiff={prevTotalDiff}
                        annualTotalDiff={annualTotalDiff}
                        prevTotalDiffRatio={prevTotalDiffRatio}
                        annualTotalDiffRatio={annualTotalDiffRatio}
                        tableItems={tableItems} />
                </Card>
                {/* PieChart 部分：1 の割合 */}
                <Card>
                    <div className="w-full">
                        <AssetPieChart assets={asset.contents} colorMap={colormap}></AssetPieChart>
                    </div>
                </Card>
            </div>
            <Card>
                <AssetBarChart assets={allAssets.contents} categories={categories.contents} colorMap={colormap} />
            </Card>
        </div>,
        { title: '資産ダッシュボード' }
    );
});