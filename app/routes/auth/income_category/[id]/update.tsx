import type { IncomeCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { KakeiboClient } from "@/libs/kakeiboClient";
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
  const client = new KakeiboClient({
    token: c.env.HONO_IS_COOL,
    baseUrl: new URL(c.req.url).origin,
  });
  const id = c.req.param("id");
  const detail = await client.getDetail<IncomeCategory>({
    endpoint: endPoint,
    contentId: id,
  });
  return c.render(
    <>
      <CategoryCreateForm
        data={{ name: detail.name }}
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
    const client = new KakeiboClient({
      token: c.env.HONO_IS_COOL,
      baseUrl: new URL(c.req.url).origin,
    });
    const { name } = c.req.valid("form");
    const body = {
      name,
    };
    const response = await client
      .updateData<IncomeCategory>({
        endpoint: endPoint,
        contentId: id,
        data: body,
      })
      .catch((e) => {
        console.error(e);
      });
    setCookie(c, successAlertCookieKey, successMesage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  },
);
