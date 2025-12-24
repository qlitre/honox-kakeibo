import { createRoute } from "honox/factory";
import {
  checkMonthlyExpenses,
  type ExpenseCheckResult,
  fetchSimpleList,
} from "@/libs/dbService";
import type { ExpenseCategory, PaymentMethod } from "@/@types/dbTypes";
import { ExpenseCreateModal } from "@/islands/expense/ExpenseCreateModal";
import { getCookie } from "hono/cookie";
import { successAlertCookieKey } from "@/settings/kakeiboSettings";
import { Alert } from "@/islands/share/Alert";

export default createRoute(async (c) => {
  const db = c.env.DB;

  // 現在の年月を取得
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString();

  // クエリパラメータから年月を取得（デフォルトは現在の年月）
  const year = c.req.query("year") || currentYear;
  const month = c.req.query("month") || currentMonth;

  try {
    // 定期支払いチェック結果を取得
    const checkResults = await checkMonthlyExpenses({ db, year, month });

    // 支出カテゴリと支払い方法を取得（モーダル用）
    const categories = await fetchSimpleList<ExpenseCategory>({
      db,
      table: "expense_category",
      orders: "id",
    });

    const paymentMethods = await fetchSimpleList<PaymentMethod>({
      db,
      table: "payment_method",
      orders: "name",
    });

    // 成功メッセージを取得
    const successMessage = getCookie(c, successAlertCookieKey);

    return c.render(
      <div className="container mx-auto px-4 py-8">
        {successMessage && <Alert message={successMessage} type="success" />}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            定期支払いチェック
          </h1>
          <a
            href="/auth/expense_check_template"
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            テンプレート管理
          </a>
        </div>

        {/* 年月選択 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <form method="GET" className="flex items-center gap-4">
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                年
              </label>
              <select
                id="year"
                name="year"
                defaultValue={year}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = now.getFullYear() - 2 + i;
                  return (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label
                htmlFor="month"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                月
              </label>
              <select
                id="month"
                name="month"
                defaultValue={month}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  return (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors cursor-pointer"
              >
                表示
              </button>
            </div>
          </form>
        </div>

        {/* チェック結果 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {year}年{month}月の定期支払い状況
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {checkResults.map((result) => (
              <div
                key={result.template.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {result.isRegistered ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-6 h-6 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {result.template.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.template.category_name} - 「
                      {result.template.description_pattern}」
                    </div>
                    {result.expense && (
                      <div className="text-sm text-gray-600 mt-1">
                        {result.expense.date} - ¥
                        {result.expense.amount.toLocaleString()} -{" "}
                        {result.expense.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      result.isRegistered
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.isRegistered ? "登録済み" : "未登録"}
                  </span>

                  {!result.isRegistered && (
                    <ExpenseCreateModal
                      buttonType="primary"
                      buttonTitle="追加"
                      data={{
                        date: `${year}-${month.padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`,
                        amount: "",
                        expense_category_id:
                          result.template.expense_category_id.toString(),
                        payment_method_id: "",
                        description: result.template.description_pattern,
                      }}
                      title="支出追加"
                      actionUrl="/auth/expense_check/create"
                      categories={categories}
                      payment_methods={paymentMethods}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {checkResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            チェックテンプレートが登録されていません
          </div>
        )}

        {/* サマリー */}
        {checkResults.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>
                登録済み: {checkResults.filter((r) => r.isRegistered).length}件
              </span>
              <span>
                未登録: {checkResults.filter((r) => !r.isRegistered).length}件
              </span>
              <span>合計: {checkResults.length}件</span>
            </div>
          </div>
        )}
      </div>,
      { title: `定期支払いチェック - ${year}年${month}月` },
    );
  } catch (error) {
    console.error("Error checking expenses:", error);
    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">エラーが発生しました</div>
      </div>,
      { title: "エラー" },
    );
  }
});
