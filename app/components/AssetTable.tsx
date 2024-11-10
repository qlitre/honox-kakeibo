import { FC } from 'react';
import type { AssetTableItems } from '@/@types/common';

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
    // 符号と色を決定する関数
    const formatDiff = (value: number) => {
        const sign = value >= 0 ? '+' : '-';
        const color = value >= 0 ? 'text-blue-500' : 'text-red-500';
        return { sign, color };
    };

    return (
        <table className="w-full table-auto border-collapse text-lg">
            <thead>
                <tr className="bg-gray-100">
                    <th className="px-4 py-4 text-left">カテゴリ名</th>
                    <th className="px-4 py-4 text-left">当月の金額</th>
                    <th className="px-4 py-4 text-left">前月比</th>
                    <th className="px-4 py-4 text-left">年初比</th>
                    <th className="px-4 py-4 text-left">構成割合</th>
                </tr>
            </thead>
            <tbody>
                {Object.values(tableItems).map((item, index) => {
                    const prevDiff = formatDiff(item.prevDiffRatio);
                    const annualDiff = formatDiff(item.annualStartDiffRatio);

                    return (
                        <tr key={index} className="border-t">
                            <td className="px-4 py-4">{item.categoryName}</td>
                            <td className="px-4 py-4">{item.now.toLocaleString()}</td>
                            <td className={`px-4 py-4 ${prevDiff.color}`}>
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
                            <td className={`px-4 py-4 ${annualDiff.color}`}>
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
                            <td className="px-4 py-4">
                                {((item.now / totalAmount) * 100).toFixed(2)}%
                            </td>
                        </tr>
                    );
                })}
                <tr className="border-t font-bold">
                    <td className="px-4 py-4">トータル</td>
                    <td className="px-4 py-4">{totalAmount.toLocaleString()}</td>
                    <td className={`px-4 py-4 ${formatDiff(prevTotalDiffRatio).color}`}>
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
                    <td className={`px-4 py-4 ${formatDiff(annualTotalDiffRatio).color}`}>
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
                    <td className="px-4 py-4">100%</td>
                </tr>
            </tbody>
        </table>
    );
};
