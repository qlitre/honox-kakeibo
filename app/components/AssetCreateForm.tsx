import type { AssetCategory, ListResponse, Asset } from "../@types/dbTypes"
import type { FC } from 'react'

type Data = Omit<Asset, 'id' | 'amount' | 'asset_category_id'> & {
    amount: string;
    asset_category_id: string;
    error?: Record<string, string[] | undefined>
}

type Props = {
    data?: Data;
    title: string;
    actionUrl: string;
    method: 'post' | 'put'
    categories: ListResponse<AssetCategory>;
}

export const AssetCreateForm: FC<Props> = ({ data, title, actionUrl, method, categories }) => {
    return (
        <>
            <main className='c-container'>
                <h1 className="text-xl font-bold mb-4">{title}</h1>
                <form action={actionUrl} method={method} className="space-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            日付
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={data?.date}
                        />
                        {data?.error?.date && <p className="text-red-500 text-sm mt-1">{data.error.date}</p>}
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            金額
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={data?.amount}
                        />
                        {data?.error?.amount && <p className="text-red-500 text-sm mt-1">{data.error.amount}</p>}
                    </div>

                    <div>
                        <label htmlFor="asset_category_id" className="block text-sm font-medium text-gray-700">
                            カテゴリID
                        </label>
                        <select
                            id="asset_category_id"
                            name="asset_category_id"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={data?.asset_category_id}
                        >
                            {categories.contents.map((category) => (
                                <option value={category.id} key={category.id}>{category.name}</option>
                            ))}
                        </select>
                        {data?.error?.asset_category_id && <p className="text-red-500 text-sm mt-1">{data.error.asset_category_id}</p>}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            説明
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                        {data?.error?.description && <p className="text-red-500 text-sm mt-1">{data.error.description}</p>}
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            送信
                        </button>
                    </div>
                </form>
            </main>
        </>
    )
}