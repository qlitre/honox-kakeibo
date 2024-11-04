import { useState, FC } from 'react'
import { Button } from '@/islands/Button'
import type { AssetWithCategory, AssetCategoryResponse } from '@/@types/dbTypes'
import { AssetCreateForm } from '@/islands/asset/AssetCreateForm'

type Props = {
    asset: AssetWithCategory
    categories: AssetCategoryResponse
}

type Data = {
    date: string;
    amount: string;
    asset_category_id: string;
    description: string
}

export const EditModal: FC<Props> = ({ asset, categories }) => {
    const [open, setOpen] = useState(false)
    const handleClick = () => {
        setOpen(true)
    }
    const data: Data = {
        date: asset.date,
        amount: String(asset.amount),
        asset_category_id: String(asset.asset_category_id),
        description: asset.description || ''
    }
    return (
        <>
            <Button type='success' onClick={handleClick}>編集</Button>
            {open && (
                <div className="fixed inset-0 z-10 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={() => setOpen(false)}
                    ></div>

                    {/* Dialog Panel */}
                    <div className="relative z-20 w-full max-w-md transform overflow-hidden rounded-lg bg-white px-6 py-4 shadow-xl transition-all sm:max-w-lg">
                        <AssetCreateForm data={data} categories={categories} title='資産編集' actionUrl={`/auth/asset/${asset.id}/update`}></AssetCreateForm>
                    </div>
                </div>
            )}
        </>
    )
}
