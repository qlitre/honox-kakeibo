import { FC } from 'react';
import type { AssetTableItems } from '@/@types/common';
import { Table } from '@/components/share/Table';
import { TableHeaderItem } from '@/@types/common';
import { formatDiff } from '@/utils/dashboardUtils';

type Props = {
    totalAmount: number;
    prevTotalDiff: number;
    annualTotalDiff: number;
    prevTotalDiffRatio: number;
    annualTotalDiffRatio: number;
    tableItems: AssetTableItems;
};

export const AssetTable: FC<Props> = ({
    totalAmount,
    prevTotalDiff,
    annualTotalDiff,
    prevTotalDiffRatio,
    annualTotalDiffRatio,
    tableItems,
}) => {
    const headers: TableHeaderItem[] = [
        { name: 'カテゴリ名', textPosition: 'left' },
        { name: '当月', textPosition: 'right' },
        { name: '前月比', textPosition: 'right' },
        { name: '年初比', textPosition: 'right' },
        { name: '構成割合', textPosition: 'right' }
    ]
    return (
        <Table headers={headers}>
            <tbody>
                {Object.values(tableItems).map((item, index) => {
                    const prevDiff = formatDiff(item.prevDiffRatio);
                    const annualDiff = formatDiff(item.annualStartDiffRatio);

                    return (
                        <tr key={index} className="border-t">
                            <td className="px-4 py-4 text-left">{item.categoryName}</td>
                            <td className="px-4 py-4 text-right">{item.now.toLocaleString()}</td>
                            <td className={`px-4 py-4 ${prevDiff.color} text-right`}>
                                <div className="flex flex-col">
                                    <span className="text-base">
                                        {prevDiff.sign}
                                        {Math.abs(item.prevDiff).toLocaleString()}
                                    </span>
                                    <span className="text-sm">
                                        {prevDiff.sign}
                                        {(Math.abs(item.prevDiffRatio) * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </td>
                            <td className={`px-4 py-4 ${annualDiff.color} text-right`}>
                                <div className="flex flex-col">
                                    <span className="text-base">
                                        {annualDiff.sign}
                                        {Math.abs(item.annualStartDiff).toLocaleString()}
                                    </span>
                                    <span className="text-sm">
                                        {annualDiff.sign}
                                        {(Math.abs(item.annualStartDiffRatio) * 100).toFixed(2)}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                                {((item.now / totalAmount) * 100).toFixed(2)}%
                            </td>
                        </tr>
                    );
                })}
                <tfoot className='bg-gray-100'>
                    <tr className="font-semibold">
                        <td className="px-4 py-4">トータル</td>
                        <td className="px-4 py-4 text-right">{totalAmount.toLocaleString()}</td>
                        <td className={`px-4 py-4 ${formatDiff(prevTotalDiffRatio).color} text-right`}>
                            <div className="flex flex-col">
                                <span className="text-base">
                                    {formatDiff(prevTotalDiffRatio).sign}
                                    {Math.abs(prevTotalDiff).toLocaleString()}
                                </span>
                                <span className="text-sm">
                                    {formatDiff(prevTotalDiffRatio).sign}
                                    {(Math.abs(prevTotalDiffRatio) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </td>
                        <td className={`px-4 py-4 ${formatDiff(annualTotalDiffRatio).color} text-right`}>
                            <div className="flex flex-col">
                                <span className="text-base">
                                    {formatDiff(annualTotalDiffRatio).sign}
                                    {Math.abs(annualTotalDiff).toLocaleString()}
                                </span>
                                <span className="text-sm">
                                    {formatDiff(annualTotalDiffRatio).sign}
                                    {(Math.abs(annualTotalDiffRatio) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </td>
                        <td className="px-4 py-4 text-right">100%</td>
                    </tr>
                </tfoot>
            </tbody>
        </Table>
    );
};
