import type { FC } from 'react'
import type { AssetCategory } from '@/@types/dbTypes'
import { PageHeader } from '@/components/PageHeader'
import { ButtonLink } from './ButtonLink'

type Props = {
    title: string
    errorMessage?: string;
    detail: AssetCategory;
    endPoint: string;
}

export const CategoryDeleteForm: FC<Props> = ({ title, errorMessage, detail, endPoint }) => {
    return (
        <>
            <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg bg-white shadow-md">
                <PageHeader title={title}></PageHeader>
                {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
                <div className="mb-4">
                    <p className="text-lg mb-2">
                        <strong>カテゴリ名：</strong> {detail.name}
                    </p>
                </div>
                <form action={`/auth/${endPoint}/${detail.id}/delete`} method="post" className="flex justify-center space-x-8">
                    <ButtonLink type='primary' href={`/auth/${endPoint}`}>
                        戻る
                    </ButtonLink>
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