import type { FC, ChangeEvent } from 'react'
import type { ExpenseCategoryResponse, PaymentMethodResponse } from '@/@types/dbTypes'
import { useState } from 'react'
import { Button } from '@/islands/Button'
import { PageHeader } from '@/components/PageHeader'

type Data = {
    date: string;
    amount: string;
    expense_category_id: string;
    payment_method_id: string;
    description: string;
    error?: Record<string, string[] | undefined>
}

type CreateFormProps = {
    data?: Data;
    title: string;
    actionUrl: string;
    categories: ExpenseCategoryResponse;
    payment_methods: PaymentMethodResponse
}


type Props = CreateFormProps & {
    buttonType: 'primary' | 'success'
    buttonTitle: string
}
const getTodayDate = () => {
    const now = new Date();
    // UTC+9（日本時間）を適用
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    // 年、月、日を取得
    const year = jstDate.getUTCFullYear();
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0'); // 月は0始まりのため+1
    const day = String(jstDate.getUTCDate()).padStart(2, '0');
    // yyyy-mm-dd形式で返す
    return `${year}-${month}-${day}`;
};

export const ExpenseCreateModal: FC<Props> = ({ buttonType, buttonTitle, data, title, actionUrl, categories, payment_methods }) => {
    const [open, setOpen] = useState(false)
    const handleClick = () => {
        setOpen(true)
    }
    const [formData, setFormData] = useState<Data>({
        date: data?.date || getTodayDate(),
        amount: data?.amount || '',
        expense_category_id: data?.expense_category_id || '',
        payment_method_id: data?.payment_method_id || '',
        description: data?.description || '',
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
            <Button type={buttonType} onClick={handleClick}>{buttonTitle}</Button>
            {open && (
                <div className="fixed inset-0 z-10 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={() => setOpen(false)}
                    ></div>

                    {/* Dialog Panel */}
                    <div className="relative z-20 w-full max-w-md transform overflow-hidden rounded-lg bg-white px-6 py-4 shadow-xl transition-all sm:max-w-lg">
                        <PageHeader title={title}></PageHeader>
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
                                <label htmlFor="expense_category_id" className="block text-sm font-medium text-gray-700">
                                    カテゴリID
                                </label>
                                <select
                                    id="expense_category_id"
                                    name="expense_category_id"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.expense_category_id}
                                    onChange={handleChange}
                                >
                                    {categories.contents.map((category) => (
                                        <option value={category.id} key={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                {formData.error?.asset_category_id && <p className="text-red-500 text-sm mt-1">{formData.error.asset_category_id}</p>}
                            </div>
                            <div>
                                <label htmlFor="payment_method_id" className="block text-sm font-medium text-gray-700">
                                    支払い方法
                                </label>
                                <select
                                    id="payment_method_id"
                                    name="payment_method_id"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.payment_method_id}
                                    onChange={handleChange}
                                >
                                    {payment_methods.contents.map((method) => (
                                        <option value={method.id} key={method.id}>{method.name}</option>
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
                                    value={formData.description}
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
                    </div>
                </div>
            )}
        </>
    )
}
