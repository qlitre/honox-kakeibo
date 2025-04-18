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
    .deleteData({ endpoint: "fund_transaction", contentId: id })
    .catch((e) => {
      console.error(e);
      return;
    });
  setCookie(
    c,
    successAlertCookieKey,
    "投資用口座入金履歴削除に成功しました。",
    { maxAge: alertCookieMaxage },
  );
  const queryString = c.req.url.split("?")[1] || "";
  return c.redirect(`/auth/fund_transaction?${queryString}`, 303);
});
