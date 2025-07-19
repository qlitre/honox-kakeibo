import { createRoute } from "honox/factory";
import { fetchSimpleList } from "@/libs/dbService";

interface ExpenseCheckTemplate {
  id: number;
  name: string;
  description_pattern: string;
  expense_category_id: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default createRoute(async (c) => {
  const db = c.env.DB;

  try {
    const query = `
      SELECT 
        ect.*,
        ec.name as category_name
      FROM expense_check_template ect
      LEFT JOIN expense_category ec ON ect.expense_category_id = ec.id
      ORDER BY ect.name
    `;
    
    const { results } = await db.prepare(query).all();
    const templates = results as ExpenseCheckTemplate[];

    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">定期支払いチェックテンプレート</h1>
          <a
            href="/auth/expense_check_template/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新規追加
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    検索パターン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {template.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.description_pattern}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
            </table>
          </div>
        </div>

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            チェックテンプレートが登録されていません
          </div>
        )}
      </div>,
      { title: "定期支払いチェックテンプレート" }
    );
  } catch (error) {
    console.error("Error fetching templates:", error);
    return c.render(
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">エラーが発生しました</div>
      </div>,
      { title: "エラー" }
    );
  }
});