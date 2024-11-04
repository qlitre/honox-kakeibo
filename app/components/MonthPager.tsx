import type { FC } from 'react'
import { BaseProps } from '@/@types/common'
import {
    getPrevMonthYear,
    getPrevMonth,
    getNextMonthYear,
    getNextMonth,
} from '../utils/dashboardUtils';

type Props = BaseProps & {
    year: number;
    month: number;
    hrefPrefix: string
}

export const MonthPager: FC<Props> = ({ className, year, month, hrefPrefix }) => {
    const prevMonthYear = getPrevMonthYear(year, month)
    const prevMonth = getPrevMonth(month)
    const nextMonthYear = getNextMonthYear(year, month)
    const nextMonth = getNextMonth(month)
    return (
        <div className="flex items-center justify-center space-x-4 py-4">
            <a
                href={`${hrefPrefix}/${prevMonthYear}/${prevMonth}`}
                className="text-gray-600 bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300 transition"
            >
                前月
            </a>
            <span className="text-lg font-semibold text-gray-800">
                {year}-{String(month).padStart(2, '0')}
            </span>
            <a
                href={`${hrefPrefix}/${nextMonthYear}/${nextMonth}`}
                className="text-gray-600 bg-gray-200 rounded-full px-3 py-1 hover:bg-gray-300 transition"
            >
                次月
            </a>
        </div>
    )
}