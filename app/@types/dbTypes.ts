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

// JOIN結果用の新しい型を定義
export interface AssetWithCategory extends Asset {
    category_name: string;
}

export interface ListResponse<T> {
    contents: T[];
    totalCount: number;
    limit: number;
    offset: number;
}

/**
CREATE TABLE IF NOT EXISTS asset_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES asset_category(id) ON DELETE RESTRICT
);
 */