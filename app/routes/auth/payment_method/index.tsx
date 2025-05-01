import type { PaymentMethodResponse } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { KakeiboClient } from "@/libs/kakeiboClient";
import { getCookie } from "hono/cookie";
import { successAlertCookieKey } from "@/settings/kakeiboSettings";
import { CategoryList } from "@/components/share/CategoryList";

export default createRoute(async (c) => {
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: new URL(c.req.url).origin,
  });
  const message = getCookie(c, successAlertCookieKey);
  const pageTitle = "支払方法一覧";
  const endPoint = "payment_method";
  const categories = await client.getListResponse<PaymentMethodResponse>({
    endpoint: endPoint,
    queries: {
      orders: "updated_at",
      limit: 100,
    },
  });
  return c.render(
    <>
      <CategoryList
        message={message}
        categories={categories.contents}
        pageTitle={pageTitle}
        endpoint={endPoint}
      ></CategoryList>
    </>,
    { title: pageTitle },
  );
});
