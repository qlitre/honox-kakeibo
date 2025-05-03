import type { AssetCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createItem } from "@/libs/dbService"; 
import { CategoryCreateForm } from "@/components/share/CategoryCreateForm";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

const schema = z.object({
  name: z.string().min(1),
  is_investment: z.enum(["1"]).optional(),
});
const endPoint = "asset_category";
const actionUrl = `/auth/${endPoint}/create`;
const redirectUrl = `/auth/${endPoint}`;
const title = "資産カテゴリ追加";
const successMesage = "資産カテゴリ追加に成功しました";

export default createRoute(async (c) => {
  return c.render(
    <>
      <CategoryCreateForm
        title={title}
        actionUrl={actionUrl}
        backUrl={`/auth/${endPoint}`}
      />
    </>,
    { title: title },
  );
});

export const POST = createRoute(
  zValidator("form", schema, async (result, c) => {
    if (!result.success) {
      const { name } = result.data;
      return c.render(
        <CategoryCreateForm
          data={{ name, error: result.error.flatten().fieldErrors }}
          title={title}
          actionUrl={actionUrl}
          backUrl={`/auth/${endPoint}`}
        />,
      );
    }
  }),
  async (c) => {
    const { name, is_investment } = c.req.valid("form");
    let _is_investment = 0;
    if (is_investment === "1") _is_investment = 1;
    const body = {
      name: name,
      is_investment: _is_investment,
    };

    const response = await createItem<AssetCategory>({db:c.env.DB,table:endPoint,data:body})
    setCookie(c, successAlertCookieKey, successMesage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  },
);
