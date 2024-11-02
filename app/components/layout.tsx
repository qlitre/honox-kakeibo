import { ReactNode } from 'react';

type Props = { children: ReactNode };

const Layout = ({ children }: Props) => {
    return <div className='c-container'>{children}</div>;
};

export default Layout;