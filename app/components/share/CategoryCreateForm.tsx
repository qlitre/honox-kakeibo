import type { FC } from 'react'
import { PageHeader } from '@/components/PageHeader'

type Data = {
    name: string
    error?: Record<string, string[] | undefined>
}

type Props = {
    data?: Data;
    title: string;
    actionUrl: string;
}

export const CategoryCreateForm: FC<Props> = ({ data, title, actionUrl }) => {
    return (
        <>
            <PageHeader title={title}></PageHeader>
            <form action={actionUrl} method='post' className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        カテゴリ名
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={data?.name}
                    />
                    {data?.error?.name && <p className="text-red-500 text-sm mt-1">{data.error.name}</p>}
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
        </>
    )
}