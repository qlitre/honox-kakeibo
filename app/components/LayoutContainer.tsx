import { ReactNode } from 'react';
import type { BaseProps } from '../@types/common';

type Props = BaseProps & { children: ReactNode };

export const LayoutContainer = (props: Props) => {
    const className = `mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8 ${props.className ?? props.className, ''}`
    return <div className={className}>{props.children}</div>;
};