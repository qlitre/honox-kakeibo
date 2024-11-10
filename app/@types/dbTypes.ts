export type KakeiboBaseField = {
    id: number
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
    name: string;
    is_investment: number; // sqliteのbool型は内部的に0か1となる
}

export type Asset = KakeiboBaseField & {
    date: string;
    amount: number;
    asset_category_id: number;
    description?: string;
}

export type AssetWithCategory = Asset & {
    category_name: string;
    is_investment: number; // sqliteのbool型は内部的に0か1となる
}


export type FundTransation = KakeiboBaseField & {
    date: string;
    amount: number;
    description?: string;
}



export type ExpenseCategory = KakeiboBaseField & {
    name: string;
};

export type PaymentMethod = KakeiboBaseField & {
    name: string;
};

export type Expense = KakeiboBaseField & {
    date: string;
    amount: number;
    expense_category_id: number;
    payment_method_id: number;
    description?: string;
}

export type IncomeCategory = KakeiboBaseField & {
    name: string;
}

export type Income = KakeiboBaseField & {
    date: string;
    amount: number;
    income_category_id: number;
    description?: string;
}

export type IncomeWithCategory = Income & {
    category_name: string
}

export type ExpenseWithDetails = Expense & {
    category_name: string;
    payment_method_name: string;
}


// 各サマリーデータの型定義
export type SummaryItem = {
    year_month: string; // "YYYY-MM"形式の年月
    total_amount: number; // 合計金額
    category_name: string; // カテゴリ名
};

// SummaryResponseの型定義
export type SummaryResponse = {
    summary: SummaryItem[];
};


export type AssetWithCategoryResponse = KakeiboListResponse<AssetWithCategory>
export type AssetCategoryResponse = KakeiboListResponse<AssetCategory>
export type ExpenseWithDetailsResponse = KakeiboListResponse<ExpenseWithDetails>
export type ExpenseCategoryResponse = KakeiboListResponse<ExpenseCategory>
export type PaymentMethodResponse = KakeiboListResponse<PaymentMethod>
export type IncomeCategoryResponse = KakeiboListResponse<IncomeCategory>
export type IncomeWithCategoryResponse = KakeiboListResponse<IncomeWithCategory>
export type FundTransationResponse = KakeiboListResponse<FundTransation>