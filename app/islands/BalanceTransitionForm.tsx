import type { ExpenseCategory, IncomeCategory } from "@/@types/dbTypes";
import type { FC } from "hono/jsx";

type Props = {
  incomeDefaultValue: string;
  incomeCategories: IncomeCategory[];
  expenseDefaultValue: string;
  expenseCategories: ExpenseCategory[];
};

export const BalanceTransitionForm: FC<Props> = ({
  incomeDefaultValue,
  incomeCategories,
  expenseDefaultValue,
  expenseCategories,
}) => {
  /**
   * フォームの自動送信ハンドラー
   */
  const handleSelectChange = (e: Event) => {
    // 1. currentTarget を HTMLSelectElement にキャストして 'form' へのアクセスを可能にする
    const target = e.currentTarget as HTMLSelectElement;
    
    // 2. target および target.form の存在を確認して安全に submit を実行する
    if (target && target.form) {
      target.form.submit();
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">フィルター設定</h3>
      <form
        action="/auth/dashboard/balance_transition"
        method="get"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="income_category_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              収入カテゴリ
            </label>
            <select
              id="income_category_id"
              name="income_category"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onChange={handleSelectChange}
              defaultValue={incomeDefaultValue}
            >
              <option value="">全カテゴリ</option>
              {incomeCategories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="expense_category_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              支出カテゴリ
            </label>
            <select
              id="expense_category_id"
              name="expense_category"
              className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              onChange={handleSelectChange}
              defaultValue={expenseDefaultValue}
            >
              <option value="">全カテゴリ</option>
              {expenseCategories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};