import type { FC, MouseEvent } from "hono/jsx";
import { useRef, useState } from "hono/jsx";
import type {
  ExpenseCategoryResponse,
  PaymentMethodResponse,
} from "@/@types/dbTypes";

type Data = {
  month: string | undefined;
  category_id: string | undefined;
  payment_method_id: string | undefined;
  keyword: string | undefined;
};

type Props = {
  data?: Data;
  categories: ExpenseCategoryResponse;
  paymentMethods: PaymentMethodResponse;
};

export const ExpenseSearchForm: FC<Props> = ({
  data,
  categories,
  paymentMethods,
}) => {
  // フォームの表示／非表示を制御する state（スマホ用）
  const [isOpen, setIsOpen] = useState(false);
  // フォームへの ref を作成
  const formRef = useRef<HTMLFormElement>(null);

  // アコーディオンのトグル
  const toggleForm = () => {
    setIsOpen((prev) => !prev);
  };

  // クリアして検索するボタンのクリックハンドラ
  const handleClearAndSearch = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (form) {
      // 各入力要素を取得して値をクリア
      const monthInput = form.elements.namedItem(
        "month",
      ) as HTMLInputElement | null;
      const categorySelect = form.elements.namedItem(
        "categoryId",
      ) as HTMLSelectElement | null;
      const paymentMethodSelect = form.elements.namedItem(
        "paymentMethodId",
      ) as HTMLSelectElement | null;
      const keywordInput = form.elements.namedItem(
        "keyword",
      ) as HTMLInputElement | null;

      if (monthInput) monthInput.value = "";
      if (categorySelect) categorySelect.value = "";
      if (paymentMethodSelect) paymentMethodSelect.value = "";
      if (keywordInput) keywordInput.value = "";

      // クリア後にフォームを送信
      form.submit();
    }
  };

  return (
    <div>
      {/* スマホ用：検索フォームの表示を切り替えるボタン */}
      <div className="sm:hidden mb-4">
        <button
          onClick={toggleForm}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isOpen ? "検索条件を閉じる" : "検索条件を開く"}
        </button>
      </div>

      {/* 常に表示（デスクトップ）／スマホではisOpenがtrueのときだけ表示 */}
      <div className={`${isOpen ? "block" : "hidden"} sm:block`}>
        <form
          ref={formRef}
          method="get"
          className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-4"
        >
          {/* 年月の入力 */}
          <input
            name="month"
            type="month"
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-auto"
            placeholder="年月"
            defaultValue={data?.month || ""}
          />

          {/* カテゴリの選択 */}
          <select
            name="categoryId"
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-48"
            defaultValue={data?.category_id || ""}
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
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-48"
            defaultValue={data?.payment_method_id || ""}
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
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-auto"
            placeholder="キーワード検索"
            defaultValue={data?.keyword || ""}
          />

          {/* ボタン群 */}
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 w-full">
            {/* 通常の検索ボタン */}
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              検索
            </button>

            {/* クリアして検索するボタン */}
            <button
              type="button"
              onClick={handleClearAndSearch}
              className="bg-gray-500 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              クリア
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
