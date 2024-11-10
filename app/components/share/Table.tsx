import { FC, ReactNode } from 'react'
import { TableHeaderItem } from '@/@types/common'

type Props = {
    headers: TableHeaderItem[]
    children: ReactNode
}

export const Table: FC<Props> = ({ headers, children }) => {
    return (
        <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-300 rounded-lg shadow ring-1 ring-black ring-opacity-5">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.map((item) => {
                                        return (
                                            <th scope="col" className={`py-4 px-6 text-${item.textPosition} text-sm font-semibold text-gray-900`}>
                                                {item.name}
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>
                            {children}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}