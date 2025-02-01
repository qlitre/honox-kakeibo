// グラフのカラーチャート。python seabornより tab20
export const colorSchema = [
    'rgba(31.00,119.00,180.00,0.6)',
    'rgba(174.00,199.00,232.00,0.6)',
    'rgba(255.00,127.00,14.00,0.6)',
    'rgba(255.00,187.00,120.00,0.6)',
    'rgba(44.00,160.00,44.00,0.6)',
    'rgba(152.00,223.00,138.00,0.6)',
    'rgba(214.00,39.00,40.00,0.6)',
    'rgba(255.00,152.00,150.00,0.6)',
    'rgba(148.00,103.00,189.00,0.6)',
    'rgba(197.00,176.00,213.00,0.6)',
    'rgba(140.00,86.00,75.00,0.6)',
    'rgba(196.00,156.00,148.00,0.6)',
    'rgba(227.00,119.00,194.00,0.6)',
    'rgba(247.00,182.00,210.00,0.6)',
    'rgba(127.00,127.00,127.00,0.6)',
    'rgba(199.00,199.00,199.00,0.6)',
    'rgba(188.00,189.00,34.00,0.6)',
    'rgba(219.00,219.00,141.00,0.6)',
    'rgba(23.00,190.00,207.00,0.6)',
    'rgba(158.00,218.00,229.00,0.6)'
];

// 家計簿の年初の月を指定
export const annualStartMonth = 1

export const kakeiboMenu = () => {
    const date = new Date();
    let year = date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric' });
    let month = date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric' });

    // 2024年、11月のようになるので、最後の文字を取り除く
    year = year.slice(0, year.length - 1);
    month = month.slice(0, month.length - 1);

    return {
        '支出管理': [
            { name: '支出リスト', href: '/auth/expense' },
            { name: '支出カテゴリリスト', href: '/auth/expense_category' },
            { name: '支払い方法リスト', href: '/auth/payment_method' },
        ],
        '収入管理': [
            { name: '収入リスト', href: '/auth/income' },
            { name: '収入カテゴリリスト', href: '/auth/income_category' },
        ],
        '資産管理': [
            { name: '資産リスト', href: '/auth/asset' },
            { name: '資産カテゴリリスト', href: '/auth/asset_category' },
            { name: '投資用口座入金履歴', href: '/auth/fund_transaction' }
        ],
        'ダッシュボード': [
            { name: '投資サマリ', href: '/auth/dashboard/investment_summary' },
            { name: '資産ダッシュボード', href: `/auth/dashboard/${new Date().getFullYear()}/${new Date().getMonth() + 1}/asset` },
            { name: '月間収支', href: `/auth/dashboard/${new Date().getFullYear()}/${new Date().getMonth() + 1}/monthly_balance` },
            { name: '収支推移', href: `/auth/dashboard/balance_transition` },
        ]
    };
};


// alertメッセージのキー
export const successAlertCookieKey = 'successMessage'
export const dangerAlertCookieKey = 'dangerMessage'
// alertメッセージの保持期間
export const alertCookieMaxage = 1
// リスト系ページの表示件数
export const kakeiboPerPage = 30