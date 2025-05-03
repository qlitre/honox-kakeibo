import type { AssetCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { updateItem, fetchDetail } from "@/libs/dbService";
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

const title = "資産カテゴリ編集";
const formActionUrl = (id: string) => `/auth/asset_category/${id}/update`;
const endPoint = "asset_category";
const successMesage = "資産カテゴリの編集に成功しました";
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
  const is_investment = detail.is_investment === 1 ? "1" : "0";
  return c.render(
    <>
      <CategoryCreateForm
        data={{ name: detail.name, is_investment: is_investment }}
        title={title}
        actionUrl={formActionUrl(id)}
        backUrl={`/auth/${endPoint}`}
      />
    </>,
    { title: title },
  );
});

export const POST = createRoute(
  zValidator("form", schema, async (result, c) => {
    if (!result.success) {
      const id = c.req.param("id");
      const { name } = result.data;
      return c.render(
        <CategoryCreateForm
          data={{ name, error: result.error.flatten().fieldErrors }}
          title={title}
          actionUrl={formActionUrl(id)}
          backUrl={`/auth/${endPoint}`}
        />,
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    const { name, is_investment } = c.req.valid("form");
    let _is_investment = 0;
    if (is_investment === "1") _is_investment = 1;
    const body = {
      name: name,
      is_investment: _is_investment,
    };
    const response = await updateItem<AssetCategory>({
      db: c.env.DB,
      table: endPoint,
      id: id,
      data: body,
    });
    setCookie(c, successAlertCookieKey, successMesage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  },
);
