import type { ExpenseCheckTemplate } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { deleteItem, fetchDetail } from "@/libs/dbService";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink } from "@/components/share/ButtonLink";

const endPoint = "expense_check_template";
const title = "チェックテンプレート削除";
const successMessage = "チェックテンプレートの削除に成功しました";
const redirectUrl = "/auth/expense_check_template";

const ExpenseCheckTemplateDeleteForm = ({
  detail,
  errorMessage,
}: {
  detail: ExpenseCheckTemplate;
  errorMessage?: string;
}) => {
  return (
    <div className="p-6 max-w-lg mx-auto border border-gray-300 rounded-lg bg-white shadow-md">
      <PageHeader title={title} />
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <div className="mb-6 space-y-3">
        <div className="border-l-4 border-red-500 pl-4">
          <p className="text-lg font-medium text-gray-900 mb-2">
            削除対象のテンプレート
          </p>
          <div className="space-y-2 text-sm">
            <p>
              <strong>名前：</strong> {detail.name}
            </p>
            <p>
              <strong>検索パターン：</strong> {detail.description_pattern}
            </p>
            <p>
              <strong>状態：</strong> {detail.is_active ? "有効" : "無効"}
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">
            ⚠️ この操作は取り消せません。本当に削除してもよろしいですか？
          </p>
        </div>
      </div>
      <form
        action={`/auth/${endPoint}/${detail.id}/delete`}
        method="post"
        className="flex justify-center space-x-4"
      >
        <ButtonLink type="primary" href={`/auth/${endPoint}`}>
          キャンセル
        </ButtonLink>
        <button
          type="submit"
          className="px-6 py-2 text-white bg-red-500 rounded hover:bg-red-600 transition-colors font-medium"
        >
          削除する
        </button>
      </form>
    </div>
  );
};

export default createRoute(async (c) => {
  const id = c.req.param("id");
  const detail = await fetchDetail<ExpenseCheckTemplate>({
    db: c.env.DB,
    table: endPoint,
    id: id,
  });

  if (!detail) {
    return c.redirect(redirectUrl, 303);
  }

  return c.render(<ExpenseCheckTemplateDeleteForm detail={detail} />, {
    title: title,
  });
});

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");

  try {
    await deleteItem({
      db: c.env.DB,
      table: endPoint,
      id: id,
    });

    setCookie(c, successAlertCookieKey, successMessage, {
      maxAge: alertCookieMaxage,
    });

    return c.redirect(redirectUrl, 303);
  } catch (error) {
    console.error("Error deleting template:", error);

    // エラー時は詳細を再取得して削除画面を再表示
    const detail = await fetchDetail<ExpenseCheckTemplate>({
      db: c.env.DB,
      table: endPoint,
      id: id,
    });

    if (!detail) {
      return c.redirect(redirectUrl, 303);
    }

    return c.render(
      <ExpenseCheckTemplateDeleteForm
        detail={detail}
        errorMessage="削除に失敗しました。もう一度お試しください。"
      />,
      { title: title },
    );
  }
});
