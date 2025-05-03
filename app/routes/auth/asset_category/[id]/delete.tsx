import type { AssetCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { deleteItem, fetchDetail } from "@/libs/dbService";
import { CategoryDeleteForm } from "@/components/share/CategoryDeleteForm";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

const endPoint = "asset_category";
const title = "資産カテゴリ削除削除";
const successMessage = "資産カテゴリの削除に成功しました";
const redirectUrl = "/auth/asset_category";

export default createRoute(async (c) => {
  const id = c.req.param("id");
  const detail = await fetchDetail<AssetCategory>({
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
    { title: title }
  );
});

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");
    const r = await deleteItem({db:c.env.DB,table:endPoint,id:id})
    setCookie(c, successAlertCookieKey, successMessage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  })
