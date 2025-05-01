import type { ExpenseCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { KakeiboClient } from "@/libs/kakeiboClient";
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
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: new URL(c.req.url).origin,
  });
  const detail = await client.getDetail<ExpenseCategory>({
    endpoint: endPoint,
    contentId: id,
  });
  return c.render(
    <>
      <CategoryDeleteForm title={title} detail={detail} endPoint={endPoint} />
    </>,
    { title: title },
  );
});

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: new URL(c.req.url).origin,
  });
  try {
    const r = await client.deleteData<ExpenseCategory>({
      endpoint: endPoint,
      contentId: id,
    });
    setCookie(c, successAlertCookieKey, successMessage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  } catch (e: any) {
    console.error(e);
    const detail = await client.getDetail<ExpenseCategory>({
      endpoint: endPoint,
      contentId: id,
    });
    const errorMessage =
      e.message || "カテゴリの削除中にエラーが発生しました。";
    return c.render(
      <>
        <CategoryDeleteForm
          errorMessage={errorMessage}
          title={title}
          detail={detail}
          endPoint={endPoint}
        />
      </>,
      { title: title },
    );
  }
});
