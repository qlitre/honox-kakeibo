import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { updateItem, fetchDetail, fetchSimpleList } from "@/libs/dbService";
import type { ExpenseCheckTemplate, ExpenseCategory } from "@/@types/dbTypes";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

const schema = z.object({
  name: z.string().min(1, "名前は必須です"),
  expense_category_id: z.string().min(1, "カテゴリは必須です"),
  description_pattern: z.string().min(1, "検索パターンは必須です"),
  is_active: z.string().optional(),
});

type FormData = {
  error?: Record<string, string[] | undefined>;
  name?: string;
  expense_category_id?: string;
  description_pattern?: string;
  is_active?: string;
};

const UpdateForm = ({
  data,
  categories,
  actionUrl,
  templateId,
}: {
  data?: FormData;
  categories: ExpenseCategory[];
  actionUrl: string;
  templateId: string;
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          チェックテンプレート編集
        </h1>

        <form action={actionUrl} method="POST" className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              名前
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={data?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="家賃、電気代など"
            />
            {data?.error?.name && (
              <p className="text-red-500 text-sm mt-1">{data.error.name[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="expense_category_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              カテゴリ
            </label>
            <select
              id="expense_category_id"
              name="expense_category_id"
              defaultValue={data?.expense_category_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選択してください</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {data?.error?.expense_category_id && (
              <p className="text-red-500 text-sm mt-1">
                {data.error.expense_category_id[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description_pattern"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              検索パターン
            </label>
            <input
              type="text"
              id="description_pattern"
              name="description_pattern"
              defaultValue={data?.description_pattern}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="家賃、電気など（部分一致）"
            />
            {data?.error?.description_pattern && (
              <p className="text-red-500 text-sm mt-1">
                {data.error.description_pattern[0]}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              支出の詳細欄でこのパターンを含むかチェックします
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              value="1"
              defaultChecked={data?.is_active === "1"}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              有効
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              更新
            </button>
            <a
              href="/auth/expense_check_template"
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md text-center transition-colors"
            >
              キャンセル
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

const title = "チェックテンプレート編集";
const endPoint = "expense_check_template";
const successMessage = "チェックテンプレートの編集に成功しました";
const redirectUrl = "/auth/expense_check_template";

export default createRoute(async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;

  // テンプレート詳細を取得
  const detail = await fetchDetail<ExpenseCheckTemplate>({
    db,
    table: endPoint,
    id: id,
  });

  if (!detail) {
    return c.redirect(redirectUrl, 303);
  }

  // 支出カテゴリ一覧を取得
  const categories = await fetchSimpleList<ExpenseCategory>({
    db,
    table: "expense_category",
    orders: "name",
  });

  return c.render(
    <UpdateForm
      data={{
        name: detail.name,
        expense_category_id: String(detail.expense_category_id),
        description_pattern: detail.description_pattern,
        is_active: String(detail.is_active),
      }}
      categories={categories.contents}
      actionUrl={`/auth/expense_check_template/${id}/update`}
      templateId={id}
    />,
    { title: title },
  );
});

export const POST = createRoute(
  zValidator("form", schema, async (result, c) => {
    if (!result.success) {
      const id = c.req.param("id");
      const db = c.env.DB;
      const { name, expense_category_id, description_pattern, is_active } =
        result.data;

      // カテゴリ一覧を再取得（エラー時に必要）
      const categories = await fetchSimpleList<ExpenseCategory>({
        db,
        table: "expense_category",
        orders: "name",
      });

      return c.render(
        <UpdateForm
          data={{
            name,
            expense_category_id,
            description_pattern,
            is_active,
            error: result.error.flatten().fieldErrors,
          }}
          categories={categories.contents}
          actionUrl={`/auth/expense_check_template/${id}/update`}
          templateId={id}
        />,
        { title: title },
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    const { name, expense_category_id, description_pattern, is_active } =
      c.req.valid("form");

    const data = {
      name,
      expense_category_id: parseInt(expense_category_id),
      description_pattern,
      is_active: is_active === "1" ? 1 : 0,
    };

    try {
      await updateItem<ExpenseCheckTemplate>({
        db: c.env.DB,
        table: endPoint,
        id: id,
        data,
      });

      setCookie(c, successAlertCookieKey, successMessage, {
        maxAge: alertCookieMaxage,
      });

      return c.redirect(redirectUrl, 303);
    } catch (error) {
      console.error("Error updating template:", error);
      return c.render(
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-600">更新に失敗しました</div>
        </div>,
        { title: "エラー" },
      );
    }
  },
);
