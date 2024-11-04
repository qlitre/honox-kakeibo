import { FC } from "react";
import type { AssetWithCategory } from "@/@types/dbTypes";

type Props = {
    asset: AssetWithCategory
}

export const AssetDeleteConfirm: FC<Props> = ({ asset }) => {
    return (
        <>
            <div className="mb-4">
                <p className="text-lg mb-2">
                    <strong>詳細：</strong> {asset.description || '説明なし'}
                </p>
                <p className="text-lg mb-2">
                    <strong>カテゴリ：</strong> {asset.category_name}
                </p>
                <p className="text-lg font-semibold">
                    <strong>金額：</strong> {asset.amount}円
                </p>
            </div>
        </>
    )
}