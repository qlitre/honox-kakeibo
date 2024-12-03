export type BaseProps = {
    className?: string | undefined;
};

export type TableHeaderItem = {
    name: string
    textPosition: 'center' | 'left' | 'right'
}

export type AssetTableItem = {
    categoryName: string;
    now: number;
    prevDiff: number;
    prevDiffRatio: number;
    annualStartDiff: number;
    annualStartDiffRatio: number;
}
export type ExpenseTableItem = {
    categoryName: string;
    now: number;
    prevDiff: number;    
}
export type AssetTableItems = Record<string, AssetTableItem>
export type ExpenseTableItems = Record<string, ExpenseTableItem>