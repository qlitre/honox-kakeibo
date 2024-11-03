type KakeiboBaseField = {
    created_at: string;
    updated_at: string
}

export type AssetCategory = KakeiboBaseField & {
    id: number;
    name: string
}

export type Asset = KakeiboBaseField & {
    id: number;
    date: string;
    amount: number;
    asset_category_id: number;
    description?: string;
}

export type AssetWithCategory = Asset & {
    category_name: string;
}

export type ListResponse<T> = {
    contents: T[];
    totalCount: number;
    limit: number;
    offset: number;
    pageSize: number;
}

export type AssetWithCategoryResponse = ListResponse<AssetWithCategory>
export type AssetCategoryResponse = ListResponse<AssetCategory>