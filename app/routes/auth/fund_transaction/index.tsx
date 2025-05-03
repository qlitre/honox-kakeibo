import type { TableHeaderItem } from "@/@types/common";
import type { FundTransation } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Alert } from "@/islands/share/Alert";
import { getCookie } from "hono/cookie";
import { successAlertCookieKey } from "@/settings/kakeiboSettings";
import { FundTransactionCreateModal } from "@/islands/fund_transation/FundTransactionCreateModal";
import { FundTransactionDeleteModal } from "@/islands/fund_transation/FundTransactionDeleteModal";
import { Table } from "@/components/share/Table";
import { getQueryString } from "@/utils/getQueryString";
import { fetchListWithFilter } from "@/libs/dbService";
import { kakeiboPerPage } from "@/settings/kakeiboSettings";

export default createRoute(async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = kakeiboPerPage;
  const offset = limit * (page - 1);

  const query = c.req.query();
  const baseUrl = new URL(c.req.url).origin;
  const queryString = getQueryString(c.req.url, baseUrl);

  const fundTransactions = await fetchListWithFilter<FundTransation>({
    db,
    table: "fund_transaction",
    orders: "-date",
    limit,
    offset,
  });

  const successMessage = getCookie(c, successAlertCookieKey);

  const headers: TableHeaderItem[] = [
    { name: "日付", textPosition: "left" },
    { name: "金額", textPosition: "right" },
    { name: "説明", textPosition: "center" },
    { name: "操作", textPosition: "center" },
  ];

  const lastUpdateId = parseInt(c.req.query("lastUpdate") ?? "0");

  return c.render(
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        {successMessage && <Alert message={successMessage} type="success" />}
        <div className="flex items-center justify-between">
          <PageHeader title="投資用口座入金履歴" />
          <FundTransactionCreateModal
            buttonType="primary"
            buttonTitle="履歴追加"
            title="作成"
            actionUrl="/auth/fund_transaction/create"
          />
        </div>
        <Table headers={headers}>
          <tbody className="divide-y divide-gray-200 bg-white">
            {fundTransactions.contents.map((tx) => (
              <tr
                key={tx.id}
                className={
                  tx.id === lastUpdateId ? "bg-green-100" : "hover:bg-gray-50"
                }
              >
                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                  {tx.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                  {tx.amount.toLocaleString()} 円
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                  {tx.description || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                  <FundTransactionCreateModal
                    buttonType="success"
                    buttonTitle="編集"
                    data={{
                      date: tx.date,
                      amount: String(tx.amount),
                      description: tx.description || "",
                    }}
                    title="編集"
                    actionUrl={`/auth/fund_transaction/${tx.id}/update?${queryString}`}
                  />
                  <FundTransactionCreateModal
                    buttonType="primary"
                    buttonTitle="複写"
                    data={{
                      date: tx.date,
                      amount: String(tx.amount),
                      description: tx.description || "",
                    }}
                    title="複写"
                    actionUrl="/auth/fund_transaction/create"
                  />
                  <FundTransactionDeleteModal
                    actionUrl={`/auth/fund_transaction/${tx.id}/delete?${queryString}`}
                    fundTransaction={tx}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          pageSize={fundTransactions.pageSize}
          currentPage={page}
          hrefPrefix="/auth/fund_transaction"
          query={query}
        />
      </div>
    </>,
    { title: "投資用口座入金履歴" }
  );
});
