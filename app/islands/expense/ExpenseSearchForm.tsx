import type { FC, MouseEvent } from 'react'
import { useRef } from 'react'
import type { ExpenseCategoryResponse, PaymentMethodResponse } from '@/@types/dbTypes'

type Data = {
    month: string | undefined;
    category_id: string | undefined;
    payment_method_id: string | undefined;
    keyword: string | undefined;
}

type Props = {
    data?: Data;
    categories: ExpenseCategoryResponse;
    paymentMethods: PaymentMethodResponse;
}

export const ExpenseSearchForm: FC<Props> = ({
    data,
    categories,
    paymentMethods,
}) => {
    // フォームへの ref を作成
    const formRef = useRef<HTMLFormElement>(null);

    // クリアして検索するボタンのクリックハンドラ
    const handleClearAndSearch = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const form = formRef.current;
        if (form) {
            // 各入力要素を取得して値をクリア
            const monthInput = form.elements.namedItem('month') as HTMLInputElement | null;
            const categorySelect = form.elements.namedItem('categoryId') as HTMLSelectElement | null;
            const paymentMethodSelect = form.elements.namedItem('paymentMethodId') as HTMLSelectElement | null;
            const keywordInput = form.elements.namedItem('keyword') as HTMLInputElement | null;

            if (monthInput) monthInput.value = '';
            if (categorySelect) categorySelect.value = '';
            if (paymentMethodSelect) paymentMethodSelect.value = '';
            if (keywordInput) keywordInput.value = '';

            // 値をクリアした後、フォームを送信
            form.submit();
        }
    };

    return (
        <form ref={formRef} method="get" className="flex space-x-4 mb-4">
            {/* 年月の入力 */}
            <input
                name="month"
                type="month"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="年月"
                defaultValue={data?.month || ''}
            />

            {/* カテゴリの選択 */}
            <select
                name="categoryId"
                className="border border-gray-300 rounded px-3 py-2 w-48"
                defaultValue={data?.category_id || ''}
            >
                <option value="">カテゴリ</option>
                {categories.contents.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>

            {/* 支払い方法の選択 */}
            <select
                name="paymentMethodId"
                className="border border-gray-300 rounded px-3 py-2 w-48"
                defaultValue={data?.payment_method_id || ''}
            >
                <option value="">支払い方法</option>
                {paymentMethods.contents.map((paymentMethod) => (
                    <option key={paymentMethod.id} value={paymentMethod.id}>
                        {paymentMethod.name}
                    </option>
                ))}
            </select>

            {/* キーワード検索 */}
            <input
                name="keyword"
                type="text"
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="キーワード検索"
                defaultValue={data?.keyword || ''}
            />

            {/* 通常の検索ボタン */}
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                検索
            </button>

            {/* クリアして検索するボタン */}
            <button
                type="button"
                onClick={handleClearAndSearch}
                className="bg-gray-500 text-white px-4 py-2 rounded"
            >
                クリア
            </button>
        </form>
    )
}
