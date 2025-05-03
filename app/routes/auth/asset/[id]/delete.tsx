import { createRoute } from "honox/factory";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";
import { deleteItem } from "@/libs/dbService"; 

const endPoint="asset"
const successMessage="資産削除に成功しました"

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");
  const response = await deleteItem({db:c.env.DB,table:endPoint,id:id})
  const queryString = c.req.url.split("?")[1] || "";
  setCookie(c, successAlertCookieKey, successMessage, {
    maxAge: alertCookieMaxage,
  });
  return c.redirect(`/auth/${endPoint}?${queryString}`, 303);
});
