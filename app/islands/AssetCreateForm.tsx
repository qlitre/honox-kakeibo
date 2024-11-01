import type { AssetCategory, ListResponse, Asset } from "../@types/dbTypes"
import type { FC, ChangeEvent } from 'react'
import { useState } from "react"

type Data = Omit<Asset, 'id' | 'amount' | 'asset_category_id'> & {
    amount: string;
    asset_category_id: string;
    error?: Record<string, string[] | undefined>
}

type Props = {
    data?: Data;
    title: string;
    actionUrl: string;
    categories: ListResponse<AssetCategory>;
}

export const AssetCreateForm: FC<Props> = ({ data, title, actionUrl, categories }) => {
    const [formData, setFormData] = useState<Data>({
        date: data?.date || '',
        amount: data?.amount || '',
        asset_category_id: data?.asset_category_id || '',
        error: data?.error,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <>
            <main className='c-container'>
                <h1 className="text-xl font-bold mb-4">{title}</h1>
                <form action={actionUrl} method='post' className="space-y-4">
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
                            value={formData.date}
                            onChange={handleChange}
                        />
                        {formData.error?.date && <p className="text-red-500 text-sm mt-1">{formData.error.date}</p>}
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
                            value={formData.amount}
                            onChange={handleChange}
                        />
                        {formData.error?.amount && <p className="text-red-500 text-sm mt-1">{formData.error.amount}</p>}
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
                            value={formData.asset_category_id}
                            onChange={handleChange}
                        >
                            {categories.contents.map((category) => (
                                <option value={category.id} key={category.id}>{category.name}</option>
                            ))}
                        </select>
                        {formData.error?.asset_category_id && <p className="text-red-500 text-sm mt-1">{formData.error.asset_category_id}</p>}
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
                            onChange={handleChange}
                        ></textarea>
                        {formData.error?.description && <p className="text-red-500 text-sm mt-1">{formData.error.description}</p>}
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