import type { ExpenseCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { deleteItem, fetchDetail } from "@/libs/dbService";
import { CategoryDeleteForm } from "@/components/share/CategoryDeleteForm";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

const endPoint = "expense_category";
const title = "支出カテゴリ削除";
const successMessage = "支出カテゴリの削除に成功しました";
const redirectUrl = "/auth/expense_category";

export default createRoute(async (c) => {
  const id = c.req.param("id");
  const detail = await fetchDetail<ExpenseCategory>({
    db: c.env.DB,
    table: endPoint,
    id: id,
  });
  if (!detail) {
    return c.redirect(redirectUrl, 303);
  }
  return c.render(
    <>
      <CategoryDeleteForm title={title} detail={detail} endPoint={endPoint} />
    </>,
    { title: title },
  );
});

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");
  const r = await deleteItem({ db: c.env.DB, table: endPoint, id: id });
  setCookie(c, successAlertCookieKey, successMessage, {
    maxAge: alertCookieMaxage,
  });
  return c.redirect(redirectUrl, 303);
});
