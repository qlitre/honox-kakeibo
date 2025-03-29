import { createRoute } from "honox/factory";
import { KakeiboClient } from "@/libs/kakeiboClient";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

export const POST = createRoute(async (c) => {
  const id = c.req.param("id");
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: c.env.BASE_URL,
  });
  const response = await client
    .deleteData({ endpoint: "expense", contentId: id })
    .catch((e) => {
      console.error(e);
      return;
    });
  const queryString = c.req.url.split("?")[1] || "";
  setCookie(c, successAlertCookieKey, "支出削除に成功しました", {
    maxAge: alertCookieMaxage,
  });
  return c.redirect(`/auth/expense?${queryString}`, 303);
});
