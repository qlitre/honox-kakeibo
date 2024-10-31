import { createRoute } from 'honox/factory'
import { Header } from '../../islands/Header'
import { PieChartTest } from '../../islands/PieChartTest'
import { ListResponse, AssetWithCategory } from '../../@types/dbTypes'

const fetchAssets = async (limit = 10, offset = 0): Promise<ListResponse<AssetWithCategory>> => {
    // 仮token
    const token = 'honoiscool';
    const response = await fetch(`http://localhost:5173/api/asset?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch assets");
    }
    // JSONパース後に型をアサート
    const data: ListResponse<AssetWithCategory> = await response.json();
    return data;
};

export default createRoute(async (c) => {
    const assets = await fetchAssets()
    return c.render(
        <>
            <Header></Header>
            <main className='c-container'>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="sm:flex sm:items-center">
                        <div className="sm:flex-auto">
                            <h1 className="text-base font-semibold text-gray-900">資産一覧</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                現在の資産をカテゴリ別に一覧表示しています。
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                    日付
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    カテゴリ
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    金額
                                                </th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                    説明
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {assets.contents.map((asset) => (
                                                <tr key={asset.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                                                        {asset.date}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {asset.category_name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {asset.amount.toLocaleString()} 円
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        {asset.description || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <PieChartTest></PieChartTest>
            </main>
        </>,
        { title: '資産管理' }
    )
})
