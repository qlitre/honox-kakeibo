import type { FC, ReactNode } from "react";
import type { BaseProps } from "@/@types/common";

type Props = BaseProps & {
    heading: string
    children: ReactNode
}

export const CardWithHeading: FC<Props> = ({ className, heading, children }) => {
    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow ${className ?? ''}`}>
            <div className="px-4 py-5 sm:p-6">
                <div className="text-sm font-medium text-gray-500">{heading}</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                    {children}
                </div>
            </div>
        </div>
    )
}

