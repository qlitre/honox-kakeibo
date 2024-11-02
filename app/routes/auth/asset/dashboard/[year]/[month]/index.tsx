import { createRoute } from 'honox/factory';
import type { AssetWithCategory, ListResponse } from '../../../../../../@types/dbTypes';
import { KakeiboClient } from '../../../../../../libs/kakeiboClient';

// 日本時間を考慮してDateオブジェクトを作成
const getJSTDate = (date: Date) => {
    const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
    return new Date(date.getTime() + jstOffset);
};

export default createRoute(async (c) => {
    const token = c.env.HONO_IS_COOL;
    const client = new KakeiboClient(token);
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));

    let fr = new Date(year, month - 1, 1);
    fr = getJSTDate(fr);
    const ge = fr.toISOString().split('T')[0];

    let to = new Date(year, month, 0);
    to = getJSTDate(to);
    const le = to.toISOString().split('T')[0];

    // APIからデータを取得
    const asset = await client.getListResponse<ListResponse<AssetWithCategory>>({
        endpoint: 'asset',
        queries: { filters: `date[greater_equal]${ge}[and]date[less_equal]${le}` }
    });

    // 合計金額の計算
    const totalAmount = asset.contents.reduce((sum, item) => sum + item.amount, 0);

    return c.render(
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">資産ダッシュボード</h1>

            {/* 上段のレイアウト: 資産一覧テーブルとアセットアロケーショングラフを横並び */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* 左: 当月のカテゴリごとの資産一覧テーブル */}
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
                            {/* カテゴリのデータ行を動的に生成 */}
                            {asset.contents.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="px-2 py-1">{item.category_name}</td>
                                    <td className="px-2 py-1">¥{item.amount.toLocaleString()}</td>
                                    <td className="px-2 py-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs">-</span> {/* 前月比（仮置き） */}
                                            <span className="text-gray-500 text-xxs">-</span> {/* 増減割合（仮置き） */}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1">
                                        <div className="flex flex-col">
                                            <span className="text-xs">-</span> {/* 年初比（仮置き） */}
                                            <span className="text-gray-500 text-xxs">-</span> {/* 増減割合（仮置き） */}
                                        </div>
                                    </td>
                                    <td className="px-2 py-1">
                                        {((item.amount / totalAmount) * 100).toFixed(2)}%
                                    </td> {/* 構成割合 */}
                                </tr>
                            ))}
                            {/* トータル行 */}
                            <tr className="border-t font-bold">
                                <td className="px-2 py-1">トータル</td>
                                <td className="px-2 py-1">¥{totalAmount.toLocaleString()}</td>
                                <td className="px-2 py-1">
                                    <div className="flex flex-col">
                                        <span className="text-xs">-</span>
                                        <span className="text-gray-500 text-xxs">-</span>
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

                {/* 右: アセットアロケーショングラフのプレースホルダー */}
                <div className="flex-1 bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-2">アセットアロケーション</h2>
                    <div className="h-64 bg-gray-100 flex items-center justify-center">
                        {/* 後でグラフコンポーネントをここに追加 */}
                        <span className="text-gray-500">グラフがここに表示されます</span>
                    </div>
                </div>
            </div>

            {/* 下段: 資産の推移グラフのプレースホルダー */}
            <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-2">資産の推移グラフ</h2>
                <div className="h-64 bg-gray-100 flex items-center justify-center">
                    {/* 後で資産推移グラフコンポーネントをここに追加 */}
                    <span className="text-gray-500">グラフがここに表示されます</span>
                </div>
            </div>
        </div>,
        { title: '資産ダッシュボード' }
    );
});
