import type { FC } from 'react'

type Props = {
    pageSize: number
    hrefPrefix: string
    currentPage?: number;
    query?: Record<string, string>
}

export const Pagination: FC<Props> = ({ pageSize, hrefPrefix, query, currentPage = 1, }) => {
    const getPath = (p: number) => {
        if (!query) return `${hrefPrefix}?page=${p}`
        const queryString = new URLSearchParams(query)
        queryString.set('page', p.toString());
        return `${hrefPrefix}?${queryString.toString()}`;
    }
    const getPaginationItem = (p: number) => {
        if (p === currentPage) {
            return (
                <span className="flex justify-center items-center h-full text-teal-400 border border-teal-400">
                    {p}
                </span>
            );
        }
        return (
            <a className="flex justify-center items-center h-full text-gray-600 hover:text-gray-400" href={getPath(p)}>
                {p}
            </a>
        );
    };

    const pager: number[] = [];
    for (let i = 1; i < pageSize + 1; i++) {
        if (i < currentPage - 2) continue;
        if (i > currentPage + 2) continue;
        pager.push(i);
    }
    return (
        <div className='py-4'>
            <ul className="flex flex-wrap justify-center items-center py-10 text-xl font-medium">
                {currentPage >= 2 && (
                    <li className="list-none w-10 h-10 m-1">
                        <a className="flex justify-center items-center h-full text-gray-600 hover:text-gray-400" href={getPath(currentPage - 1)}>
                            prev
                        </a>
                    </li>
                )}
                {currentPage >= 4 && (
                    <li className="list-none w-10 h-10 m-1">
                        {getPaginationItem(1)}
                    </li>
                )}
                {currentPage >= 5 && <span className="text-gray-400 mx-3 my-1">...</span>}

                {pager.map((number) => (
                    <li className="list-none w-10 h-10 m-1" key={number}>
                        {getPaginationItem(number)}
                    </li>
                ))}
                {currentPage <= pageSize - 4 && <span className="text-gray-400 mx-3 my-1">...</span>}
                {currentPage <= pageSize - 3 && (
                    <li className="list-none w-10 h-10 m-1">
                        {getPaginationItem(pageSize)}
                    </li>
                )}
                {currentPage < pageSize && (
                    <li className="list-none w-10 h-10 m-1">
                        <a className="flex justify-center items-center h-full text-gray-600 hover:text-gray-400" href={getPath(currentPage + 1)}>
                            next
                        </a>
                    </li>
                )}
            </ul>
        </div>
    );
};