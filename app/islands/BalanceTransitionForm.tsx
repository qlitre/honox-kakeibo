import type { ExpenseCategory, IncomeCategory } from "@/@types/dbTypes";
import type { FC } from "react";

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
  return (
    <form action="/auth/dashboard/balance_transition" method="GET">
      <select
        id="income_category_id"
        name="income_category"
        className="mt-1 block border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        onChange={(e) => e.currentTarget.form?.submit()}
        defaultValue={incomeDefaultValue}
      >
        <option value="" disabled>
          収入カテゴリ
        </option>
        {incomeCategories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        id="expense_category_id"
        name="expense_category"
        className="mt-1 block border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        onChange={(e) => e.currentTarget.form?.submit()}
        defaultValue={expenseDefaultValue}
      >
        <option value="" disabled>
          支出カテゴリ
        </option>
        {expenseCategories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </form>
  );
};
