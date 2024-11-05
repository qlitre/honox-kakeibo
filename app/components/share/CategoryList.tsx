import { FC } from "react";
import { AlertSuccess } from "@/islands/share/AlertSuccess";
import { PageHeader } from "../PageHeader";
import { AssetCategory, ExpenseCategory } from "@/@types/dbTypes";


type Props = {
    message?: string;
    categories: AssetCategory[] | ExpenseCategory[]
    pageTitle: string;
    endpoint: string
}

export const CategoryList: FC<Props> = ({ message, categories, pageTitle, endpoint }) => {
    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {message && <AlertSuccess message={message} />}
                <div className="flex justify-between items-center mb-4">
                    <PageHeader className='mb-0 md:mb-0' title={pageTitle} />
                    <a
                        href={`/auth/${endpoint}/create`}
                        className="text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded transition-colors"
                    >
                        カテゴリ追加
                    </a>
                </div>
                <ul className="space-y-2">
                    {categories.map((category) => (
                        <li
                            key={category.id}
                            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 flex justify-between items-center"
                        >
                            <span className="text-gray-700 font-medium">{category.name}</span>
                            <div className="flex space-x-4">
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
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}