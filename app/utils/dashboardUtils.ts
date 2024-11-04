import { annualStartMonth } from "@/settings/kakeiboSettings"

// 前月の年を返す
export const getPrevMonthYear = (year: number, month: number) => {
    if (month == 1) return year - 1
    return year
}

// 前月を返す
export const getPrevMonth = (month: number) => {
    if (month == 1) return 12
    return month - 1
}

export const getNextMonthYear = (year: number, month: number) => {
    if (month == 12) return year + 1
    return year
}

export const getNextMonth = (month: number) => {
    if (month == 12) return 1
    return month + 1
}

// 日本時間を考慮してDateオブジェクトを作成
export const getJSTDate = (date: Date) => {
    const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
    return new Date(date.getTime() + jstOffset);
};

export const getBeginningOfMonth = (year: number, month: number) => {
    let d = new Date(year, month - 1, 1);
    d = getJSTDate(d);
    return d.toISOString().split('T')[0];
}

export const getEndOfMonth = (year: number, month: number) => {
    let d = new Date(year, month, 0);
    d = getJSTDate(d);
    return d.toISOString().split('T')[0];
}

// 家計簿の年初で指定された月の年を返す
export const getAnnualStartYear = (year: number, month: number) => {
    if (month >= annualStartMonth) return year
    return year - 1
}