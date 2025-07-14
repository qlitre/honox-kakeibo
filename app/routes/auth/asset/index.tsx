import type { TableHeaderItem } from "@/@types/common";
import type { AssetCategory, AssetWithCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Alert } from "@/islands/share/Alert";
import { AssetDeleteModal } from "@/islands/asset/AssetDeleteModal";
import { AssetCreateModal } from "@/islands/asset/AssetCreateModal";
import { Table } from "@/components/share/Table";
import { getCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  dangerAlertCookieKey,
} from "@/settings/kakeiboSettings";
import { getQueryString } from "@/utils/getQueryString";
import { fetchListWithFilter, fetchSimpleList } from "@/libs/dbService";
import { kakeiboPerPage } from "@/settings/kakeiboSettings";
import { getTodayDate } from "@/utils/dateUtils";

export default createRoute(async (c) => {
  const db = c.env.DB;
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = Number(kakeiboPerPage || 10);
  const offset = limit * (page - 1);
  const query = c.req.query();
  const baseUrl = new URL(c.req.url).origin;
  const queryString = getQueryString(c.req.url, baseUrl);

  // 資産一覧取得
  const assets = await fetchListWithFilter<AssetWithCategory>({
    db,
    table: "asset",
    orders: "-date,asset_category_id",
    limit,
    offset,
  });

  // カテゴリ一覧取得
  const categories = await fetchSimpleList<AssetCategory>({
    db,
    table: "asset_category",
    orders: "updated_at",
  });

  const successMessage = getCookie(c, successAlertCookieKey);
  const dangerMessage = getCookie(c, dangerAlertCookieKey);
  const headers: TableHeaderItem[] = [
    { name: "日付", textPosition: "left" },
    { name: "カテゴリ", textPosition: "left" },
    { name: "金額", textPosition: "right" },
    { name: "説明", textPosition: "center" },
    { name: "操作", textPosition: "center" },
  ];

  const lastUpdateId = parseInt(c.req.query("lastUpdate") ?? "0");

  return c.render(
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        {successMessage && <Alert message={successMessage} type="success" />}
        {dangerMessage && <Alert message={dangerMessage} type="danger" />}
        <div className="flex items-center justify-between">
          <PageHeader title="資産リスト" />
          <AssetCreateModal
            buttonType="primary"
            buttonTitle="資産追加"
            title="作成"
            actionUrl="/auth/asset/create"
            categories={categories}
          />
        </div>
        <Table headers={headers}>
          <tbody className="divide-y divide-gray-200 bg-white">
            {assets.contents.map((asset) => (
              <tr
                key={asset.id}
                className={
                  asset.id === lastUpdateId
                    ? "bg-green-100"
                    : "hover:bg-gray-50"
                }
              >
                <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                  {asset.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {asset.category_name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                  {asset.amount.toLocaleString()} 円
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                  {asset.description || "-"}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                  <AssetCreateModal
                    buttonType="success"
                    buttonTitle="編集"
                    data={{
                      date: asset.date,
                      amount: String(asset.amount),
                      asset_category_id: String(asset.asset_category_id),
                      description: asset.description ?? "",
                    }}
                    title="編集"
                    actionUrl={`/auth/asset/${asset.id}/update?${queryString}`}
                    categories={categories}
                  />
                  <AssetCreateModal
                    buttonType="primary"
                    buttonTitle="複写"
                    data={{
                      date: getTodayDate(),
                      amount: String(asset.amount),
                      asset_category_id: String(asset.asset_category_id),
                      description: asset.description ?? "",
                    }}
                    title="複写"
                    actionUrl="/auth/asset/create"
                    categories={categories}
                  />
                  <AssetDeleteModal
                    actionUrl={`/auth/asset/${asset.id}/delete?${queryString}`}
                    asset={asset}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination
          pageSize={assets.pageSize}
          currentPage={page}
          hrefPrefix="/auth/asset"
          query={query}
        />
      </div>
    </>,
    { title: "資産リスト" },
  );
});
