import type { FC } from 'react'
import { BaseProps } from '@/@types/common'

type Props = BaseProps & {
    title: string
}

export const PageHeader: FC<Props> = ({ className, title }) => {
    return (
        <div className={`mb-8 sm:mb-4 ${className ?? ''}`}>
            <div className="mt-2 md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 sm:truncate sm:tracking-tight text-center md:text-left">
                        {title}
                    </h2>
                </div>
            </div>
        </div>
    )
}