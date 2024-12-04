import type { FC, ReactNode } from "react";
import type { BaseProps } from "@/@types/common";

type Props = BaseProps & {
    children: ReactNode
}

export const Card: FC<Props> = ({ className, children }) => {
    return (
        <div className={`overflow-hidden rounded-lg bg-white shadow-lg ${className ?? ''}`}>
            <div className="px-4 py-5 sm:p-6">
                {children}
            </div>
        </div>
    )
}

