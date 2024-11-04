import { FC } from "react";
import type { ExpenseWithDetails } from "@/@types/dbTypes";

type Props = {
    expense: ExpenseWithDetails
}

export const ExpenseDeleteConfirm: FC<Props> = ({ expense }) => {
    return (
        <>
            <div className="mb-4">
                <p className="text-lg mb-2">
                    <strong>詳細：</strong> {expense.description || '説明なし'}
                </p>
                <p className="text-lg mb-2">
                    <strong>カテゴリ：</strong> {expense.category_name}
                </p>
                <p className="text-lg mb-2">
                    <strong>支払い方法：</strong> {expense.payment_method_name}
                </p>
                <p className="text-lg font-semibold">
                    <strong>金額：</strong> {expense.amount}円
                </p>
            </div>
        </>
    )
}