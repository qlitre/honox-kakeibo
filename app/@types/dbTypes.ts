export type KakeiboBaseField = {
    created_at: string;
    updated_at: string
}


export type KakeiboListResponse<T> = {
    contents: T[];
    totalCount: number;
    limit: number;
    offset: number;
    pageSize: number;
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


export type ExpenseCategory = KakeiboBaseField & {
    id: number;
    name: string;
};

export type PaymentMethod = KakeiboBaseField & {
    id: number;
    method_name: string;
};

export type Expense = KakeiboBaseField & {
    id: number;
    date: string;
    amount: number;
    expense_category_id: number;
    payment_method_id: number;
    description?: string;
}

export type ExpenseWithDetails = Expense & {
    category_name: string;
    payment_method_name: string;
}

export type AssetWithCategoryResponse = KakeiboListResponse<AssetWithCategory>
export type AssetCategoryResponse = KakeiboListResponse<AssetCategory>
export type ExpenseWithDetailsResPonse = KakeiboListResponse<ExpenseWithDetails>
export type ExpenseCategoryResponse = KakeiboListResponse<ExpenseCategory>
export type PaymentMethodResponse = KakeiboListResponse<PaymentMethod>
