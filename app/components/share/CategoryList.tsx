import type { FC } from "react";
import type { AssetCategory, ExpenseCategory, IncomeCategory, PaymentMethod } from "@/@types/dbTypes";
import { Alert } from "@/islands/share/AlertSuccess";
import { PageHeader } from "@/components/PageHeader";

type Props = {
    message?: string;
    categories: AssetCategory[] | ExpenseCategory[] | IncomeCategory[] | PaymentMethod[]
    pageTitle: string;
    endpoint: string
}

export const CategoryList: FC<Props> = ({ message, categories, pageTitle, endpoint }) => {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {message && <Alert message={message} type="success" />}
                <div className="flex justify-between items-center mb-4">
                    <PageHeader className='mb-0 md:mb-0' title={pageTitle} />
                    <a
                        href={`/auth/${endpoint}/create`}
                        className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors"
                    >
                        カテゴリ追加
                    </a>
                </div>
                {/**overflow-hidden rounded-lg bg-white shadow-lg */}
                <ul className="space-y-2">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 grid grid-cols-3 gap-4"
                        >
                            <div>
                                <span className="text-gray-700 font-medium">{category.name}</span>
                            </div>
                            <div>
                                {endpoint === "asset_category" && (category as AssetCategory).is_investment === 1 && (
                                    <span className="ml-2 text-green-500 font-semibold">投資用</span>
                                )}
                            </div>
                            <div className="space-x-4 text-right">
                                <a
                                    href={`/auth/${endpoint}/${category.id}/update`}
                                    className="text-blue-500 hover:underline"
                                >
                                    編集
                                </a>
                                <a
                                    href={`/auth/${endpoint}/${category.id}/delete`}
                                    className="text-red-500 hover:underline"
                                >
                                    削除
                                </a>
                            </div>
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    )
}