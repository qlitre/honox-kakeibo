export type AssetCategory = {
    id: number;
    name: string
}

export type Asset = {
    id: number;
    date: string;
    amount: number;
    asset_category_id: number;
    description?: string;
}

export interface AssetWithCategory extends Asset {
    category_name: string;
}

export interface ListResponse<T> {
    contents: T[];
    totalCount: number;
    limit: number;
    offset: number;
}