import { createRoute } from "honox/factory";
import { fetchSimpleList } from "@/libs/dbService";
import type { ExpenseCheckTemplateWithDetails } from "@/@types/dbTypes";
import type { TableHeaderItem } from "@/@types/common";
import { PageHeader } from "@/components/PageHeader";
import { Table } from "@/components/share/Table";

export default createRoute(async (c) => {
  const db = c.env.DB;

  const templates = await fetchSimpleList<ExpenseCheckTemplateWithDetails>({
    db,
    table: "expense_check_template",
    orders: "updated_at",
  });

  const headers: TableHeaderItem[] = [
    { name: "名前", textPosition: "left" },
    { name: "カテゴリ", textPosition: "left" },
    { name: "検索パターン", textPosition: "left" },
    { name: "状態", textPosition: "center" },
    { name: "操作", textPosition: "center" },
  ];

  return c.render(
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <PageHeader title="定期支払いチェックテンプレート" />
        <a
          href="/auth/expense_check_template/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          新規追加
        </a>
      </div>
      <Table headers={headers}>
        <tbody className="divide-y divide-gray-200 bg-white">
          {templates.contents.map((template) => (
            <tr key={template.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-6 text-sm text-gray-900">
                {template.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {template.category_name}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {template.description_pattern}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-center">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    template.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {template.is_active ? "有効" : "無効"}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 flex space-x-4 justify-center">
                <a
                  href={`/auth/expense_check_template/${template.id}/update`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  編集
                </a>
                <a
                  href={`/auth/expense_check_template/${template.id}/delete`}
                  className="text-red-600 hover:text-red-900"
                >
                  削除
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {templates.totalCount === 0 && (
        <div className="text-center py-8 text-gray-500">
          チェックテンプレートが登録されていません
        </div>
      )}
    </div>,
    { title: "定期支払いチェックテンプレート" },
  );
});
