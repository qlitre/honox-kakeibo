// グラフのカラーチャート。python seabornより sns paired
export const colorSchema = ['rgba(166.65098039215687,206.8078431372549,227.89019607843136,0.6)',
    'rgba(31.12156862745098,120.47058823529412,180.7058823529412,0.6)',
    'rgba(178.69803921568626,223.87450980392157,138.54117647058823,0.6)',
    'rgba(51.2,160.62745098039215,44.17254901960784,0.6)',
    'rgba(251.98431372549018,154.60392156862744,153.6,0.6)',
    'rgba(227.89019607843136,26.101960784313725,28.109803921568627,0.6)',
    'rgba(253.9921568627451,191.74901960784314,111.43529411764706,0.6)',
    'rgba(256.0,127.49803921568628,0.0,0.6)',
    'rgba(202.7921568627451,178.69803921568626,214.8392156862745,0.6)',
    'rgba(106.41568627450981,61.23921568627451,154.60392156862744,0.6)',
    'rgba(256.0,256.0,153.6,0.6)',
    'rgba(177.69411764705882,89.34901960784313,40.15686274509804,0.6)',
    'rgba(166.65098039215687,206.8078431372549,227.89019607843136,0.6)',
    'rgba(31.12156862745098,120.47058823529412,180.7058823529412,0.6)',
    'rgba(178.69803921568626,223.87450980392157,138.54117647058823,0.6)',
    'rgba(51.2,160.62745098039215,44.17254901960784,0.6)',
    'rgba(251.98431372549018,154.60392156862744,153.6,0.6)',
    'rgba(227.89019607843136,26.101960784313725,28.109803921568627,0.6)',
    'rgba(253.9921568627451,191.74901960784314,111.43529411764706,0.6)',
    'rgba(256.0,127.49803921568628,0.0,0.6)',
    'rgba(202.7921568627451,178.69803921568626,214.8392156862745,0.6)',
    'rgba(106.41568627450981,61.23921568627451,154.60392156862744,0.6)',
    'rgba(256.0,256.0,153.6,0.6)',
    'rgba(177.69411764705882,89.34901960784313,40.15686274509804,0.6)']

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
        '資産管理': [
            { name: '資産リスト', href: '/auth/asset' },
            { name: '資産カテゴリリスト', href: '/auth/asset_category' },
            { name: '投資用口座入金履歴', href: '/auth/fund_transaction' }
        ],
        '支出管理': [
            { name: '支出リスト', href: '/auth/expense' },
            { name: '支出カテゴリリスト', href: '/auth/expense_category' },
            { name: '支払い方法リスト', href: '/auth/payment_method' },
        ],
        '収入管理': [
            { name: '収入リスト', href: '/auth/income' },
            { name: '収入カテゴリリスト', href: '/auth/income_category' },
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