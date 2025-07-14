import type { TableHeaderItem } from "@/@types/common";
import type {
  ExpenseCategory,
  PaymentMethod,
  ExpenseWithDetails,
} from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Alert } from "@/islands/share/Alert";
import { getCookie } from "hono/cookie";
import { successAlertCookieKey } from "@/settings/kakeiboSettings";
import { ExpenseDeleteModal } from "@/islands/expense/ExpenseDeleteModal";
import { ExpenseCreateModal } from "@/islands/expense/ExpenseCreateModal";
import { ExpenseSearchForm } from "@/islands/expense/ExpenseSearchForm";
import { Table } from "@/components/share/Table";
import { kakeiboPerPage } from "@/settings/kakeiboSettings";
import { getBeginningOfMonth, getEndOfMonth } from "@/utils/dashboardUtils";
import { getQueryString } from "@/utils/getQueryString";
import { fetchListWithFilter, fetchSimpleList } from "@/libs/dbService";
import { getTodayDate } from "@/utils/dateUtils";

export default createRoute(async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = kakeiboPerPage;
  const offset = limit * (page - 1);
  const month = c.req.query("month");
  const categoryId = c.req.query("categoryId");
  const paymentMethodId = c.req.query("paymentMethodId");
  const keyword = c.req.query("keyword");
  let filterString = "";
  if (month) {
    const year = Number(month.slice(0, 4));
    const _month = Number(month.slice(5, 7));
    const ge = getBeginningOfMonth(year, _month);
    const le = getEndOfMonth(year, _month);
    filterString += `date[greater_equal]${ge}[and]date[less_equal]${le}`;
  }
  if (categoryId) {
    const s = `expense_category_id[eq]${categoryId}`;
    filterString += filterString ? `[and]${s}` : s;
  }
  if (paymentMethodId) {
    const s = `payment_method_id[eq]${paymentMethodId}`;
    filterString += filterString ? `[and]${s}` : s;
  }
  if (keyword) {
    const s = `description[contain]${keyword}`;
    filterString += filterString ? `[and]${s}` : s;
  }

  const query = c.req.query();
  const baseUrl = new URL(c.req.url).origin;
  const queryString = getQueryString(c.req.url, baseUrl);

  // 支出一覧の取得
  const expenses = await fetchListWithFilter<ExpenseWithDetails>({
    db,
    table: "expense",
    filters: filterString,
    orders: "-date,expense_category_id",
    limit,
    offset,
  });

  // カテゴリ・支払い方法
  const categories = await fetchSimpleList<ExpenseCategory>({
    db,
    table: "expense_category",
    orders: "updated_at",
  });

  const paymentMethods = await fetchSimpleList<PaymentMethod>({
    db,
    table: "payment_method",
    orders: "updated_at",
  });

  const successMessage = getCookie(c, successAlertCookieKey);

  const headers: TableHeaderItem[] = [
    { name: "日付", textPosition: "left" },
    { name: "カテゴリ", textPosition: "left" },
    { name: "金額", textPosition: "right" },
    { name: "支払い方法", textPosition: "left" },
    { name: "説明", textPosition: "center" },
    { name: "操作", textPosition: "center" },
  ];

  const lastUpdate = c.req.query("lastUpdate") ?? "0";
  const lastUpdateId = parseInt(lastUpdate);

  return c.render(
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        {successMessage && <Alert message={successMessage} type="success" />}
        <div className="flex items-center justify-between">
          <PageHeader title="支出リスト" />
          <ExpenseCreateModal
            buttonType="primary"
            buttonTitle="支出追加"
            title="作成"
            actionUrl="/auth/expense/create"
            categories={categories}
            payment_methods={paymentMethods}
          />
        </div>
        <ExpenseSearchForm
          data={{
            month,
            category_id: categoryId,
            payment_method_id: paymentMethodId,
            keyword,
          }}
          categories={categories}
          paymentMethods={paymentMethods}
        />
        <Table headers={headers}>
          <tbody className="divide-y divide-gray-200 bg-white">
            {expenses.contents.map((expense) => (
              <tr
                key={expense.id}
                className={
                  expense.id === lastUpdateId
                    ? "bg-green-100"
                    : "hover:bg-gray-50"
                }
              >
                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                  {expense.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {expense.category_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                  {expense.amount.toLocaleString()} 円
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {expense.payment_method_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                  {expense.description || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                  <ExpenseCreateModal
                    buttonType="success"
                    buttonTitle="編集"
                    data={{
                      date: expense.date,
                      amount: String(expense.amount),
                      expense_category_id: String(expense.expense_category_id),
                      payment_method_id: String(expense.payment_method_id),
                      description: expense.description || "",
                    }}
                    title="編集"
                    actionUrl={`/auth/expense/${expense.id}/update?${queryString}`}
                    categories={categories}
                    payment_methods={paymentMethods}
                  />
                  <ExpenseCreateModal
                    buttonType="primary"
                    buttonTitle="複写"
                    data={{
                      date: getTodayDate(),
                      amount: String(expense.amount),
                      expense_category_id: String(expense.expense_category_id),
                      payment_method_id: String(expense.payment_method_id),
                      description: expense.description || "",
                    }}
                    title="複写"
                    actionUrl="/auth/expense/create"
                    categories={categories}
                    payment_methods={paymentMethods}
                  />
                  <ExpenseDeleteModal
                    actionUrl={`/auth/expense/${expense.id}/delete?${queryString}`}
                    expense={expense}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          pageSize={expenses.pageSize}
          currentPage={page}
          hrefPrefix="/auth/expense"
          query={query}
        />
      </div>
    </>,
    { title: "支出リスト" },
  );
});
