import type { IncomeCategory } from "@/@types/dbTypes";
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
});

const title = "収入カテゴリ編集";
const formActionUrl = (id: string) => `/auth/income_category/${id}/update`;
const endPoint = "income_category";
const successMesage = "収入カテゴリの編集に成功しました";
const redirectUrl = "/auth/income_category";

export default createRoute(async (c) => {
  const id = c.req.param("id");
  const detail = await fetchDetail<IncomeCategory>({
    db: c.env.DB,
    table: endPoint,
    id: id,
  });
  if (!detail) {
    return c.redirect(redirectUrl, 303);
  }
  return c.render(
    <>
      <CategoryCreateForm
        data={{ name: detail.name }}
        title={title}
        actionUrl={formActionUrl(id)}
        backUrl={`/auth/${endPoint}`}
      />
    </>,
    { title: title }
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
        />
      );
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    const { name } = c.req.valid("form");
    const body = {
      name: name,
    };
    const response = await updateItem<IncomeCategory>({
      db: c.env.DB,
      table: endPoint,
      id: id,
      data: body,
    });
    setCookie(c, successAlertCookieKey, successMesage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  }
);
