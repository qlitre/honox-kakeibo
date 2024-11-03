import type { FC } from 'react'
import type { AssetCategory } from '../@types/dbTypes'

type Props = {
    errorMessage?: string;
    detail: AssetCategory
}

export const AssetCategoryDeleteForm: FC<Props> = ({ errorMessage, detail }) => {
    return (
        <>
            <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg bg-white shadow-md">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">資産カテゴリ削除</h1>
                {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
                <div className="mb-4">
                    <p className="text-lg mb-2">
                        <strong>カテゴリ名：</strong> {detail.name}
                    </p>
                </div>
                <form action={`/auth/asset_category/${detail.id}/delete`} method="post" className="flex justify-center">
                    <button
                        type="submit"
                        className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                    >
                        削除
                    </button>
                </form>
            </div>
        </>
    )
}