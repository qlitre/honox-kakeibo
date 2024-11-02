import { createRoute } from 'honox/factory';
import type { AssetWithCategory, ListResponse, AssetCategory } from '../../../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../../../libs/kakeiboClient';
import { AssetPieChart } from '../../../../../../islands/AssetPieChart';
import { AssetBarChart } from '../../../../../../islands/AssetBarChart';

// 前月の年を返す
const getPrevMonthYear = (year: number, month: number) => {
    if (month == 1) return year - 1
    return year
}

// 前月を返す
const getPrevMonth = (month: number) => {
    if (month == 1) return 12
    return month - 1
}

const getNextMonthYear = (year: number, month: number) => {
    if (month == 12) return year + 1
    return year
}

const getNextMonth = (month: number) => {
    if (month == 12) return 1
    return month + 1
}



// 日本時間を考慮してDateオブジェクトを作成
const getJSTDate = (date: Date) => {
    const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
    return new Date(date.getTime() + jstOffset);
};

const getBeginningOfMonth = (year: number, month: number) => {
    let d = new Date(year, month - 1, 1);
    d = getJSTDate(d);
    return d.toISOString().split('T')[0];
}

const getEndOfMonth = (year: number, month: number) => {
    let d = new Date(year, month, 0);
    d = getJSTDate(d);
    return d.toISOString().split('T')[0];
}

export default createRoute(async (c) => {
    const token = c.env.HONO_IS_COOL;
    const client = new KakeiboClient(token);
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    const ge = getBeginningOfMonth(year, month)
    const le = getEndOfMonth(year, month)

    // APIからデータを取得
    const asset = await client.getListResponse<ListResponse<AssetWithCategory>>({
        endpoint: 'asset',
        queries: { limit: 100, filters: `date[greater_equal]${ge}[and]date[less_equal]${le}` }
    });

    const prevYear = getPrevMonthYear(year, month)
    const prevMonth = getPrevMonth(month)
    const prevGe = getBeginningOfMonth(prevYear, prevMonth)
    const prevLe = getEndOfMonth(prevYear, prevMonth)
    // APIからデータを取得
    const prevAsset = await client.getListResponse<ListResponse<AssetWithCategory>>({
        endpoint: 'asset',
        queries: { limit: 100, filters: `date[greater_equal]${prevGe}[and]date[less_equal]${prevLe}` }
    });
    type TableItem = {
        categoryName: string
        now: number
        prevDiff: number
        prevDiffRatio: number
    }
    const tableItems: Record<string, TableItem> = {}
    for (const elm of asset.contents) {
        const categoryId = elm.asset_category_id
        tableItems[categoryId] = {
            categoryName: elm.category_name,
            now: elm.amount,
            prevDiff: 0,
            prevDiffRatio: 0
        }
    }
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
                prevDiffRatio: -1
            }
        }
    }
    // 合計金額の計算
    const totalAmount = asset.contents.reduce((sum, item) => sum + item.amount, 0);
    const prevTotalAmount = prevAsset.contents.reduce((sum, item) => sum + item.amount, 0);
    const totalDiff = totalAmount - prevTotalAmount
    const totalDiffRatio = totalDiff / prevTotalAmount

    // BarChart用のデータ
    const preReq = await client.getListResponse<ListResponse<AssetWithCategory>>({ endpoint: 'asset' })
    const totalCount = preReq.totalCount
    const allAssets = await client.getListResponse<ListResponse<AssetWithCategory>>({
        endpoint: 'asset', queries: {
            limit: totalCount
        }
    })
    const categories = await client.getListResponse<ListResponse<AssetCategory>>({
        endpoint: 'asset_category', queries: {
            limit: 100
        }
    })



    return c.render(
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">資産ダッシュボード</h1>
            <div className="flex items-center justify-center space-x-4 py-4">
                <a
                    href={`/auth/asset/dashboard/${prevYear}/${prevMonth}`}
                    className="text-gray-600 bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300 transition"
                >
                    前月
                </a>
                <span className="text-lg font-semibold text-gray-800">
                    {year}-{String(month).padStart(2, '0')}
                </span>
                <a
                    href={`/auth/asset/dashboard/${getNextMonthYear(year, month)}/${getNextMonth(month)}`}
                    className="text-gray-600 bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300 transition"
                >
                    次月
                </a>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 bg-white shadow-md rounded-lg p-4 overflow-auto">
                    <h2 className="text-lg font-semibold mb-2">当月の資産カテゴリ別一覧</h2>
                    <table className="w-full table-auto border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-2 py-1 text-left">カテゴリ名</th>
                                <th className="px-2 py-1 text-left">当月の金額</th>
                                <th className="px-2 py-1 text-left">前月比</th>
                                <th className="px-2 py-1 text-left">年初比</th>
                                <th className="px-2 py-1 text-left">構成割合</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(tableItems).map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="px-2 py-1">{item.categoryName}</td>
                                    <td className="px-2 py-1">¥{item.now.toLocaleString()}</td>
                                    <td className="px-2 py-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs">¥{item.prevDiff.toLocaleString()}</span>
                                            <span className="text-gray-500 text-xxs">
                                                {(item.prevDiffRatio * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs">-</span>
                                            <span className="text-gray-500 text-xxs">-</span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-1">
                                        {((item.now / totalAmount) * 100).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t font-bold">
                                <td className="px-2 py-1">トータル</td>
                                <td className="px-2 py-1">¥{totalAmount.toLocaleString()}</td>
                                <td className="px-2 py-1">
                                    <div className="flex flex-col">
                                        <span className="text-xs">¥{totalDiff.toLocaleString()}</span>
                                        <span className="text-gray-500 text-xxs">{(totalDiffRatio * 100).toFixed(2)}%</span>
                                    </div>
                                </td>
                                <td className="px-2 py-1">
                                    <div className="flex flex-col">
                                        <span className="text-xs">-</span>
                                        <span className="text-gray-500 text-xxs">-</span>
                                    </div>
                                </td>
                                <td className="px-2 py-1">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex-1 bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-2">アセットアロケーション</h2>
                    <div className="flex items-center justify-center">
                        <AssetPieChart assets={asset.contents}></AssetPieChart>
                    </div>
                </div>
            </div>
            {/* 棒グラフコンポーネントを横一杯に広げる */}
            <div className="bg-white shadow-md rounded-lg p-4 w-full"> {/* 高さを h-64 に設定 */}
                <h2 className="text-lg font-semibold mb-2">資産の推移グラフ</h2>
                <AssetBarChart assets={allAssets.contents} categories={categories.contents} />
            </div>
        </div>,
        { title: '資産ダッシュボード' }
    );
});
