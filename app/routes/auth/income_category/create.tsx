import type { IncomeCategory } from "@/@types/dbTypes";
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
});

const endPoint = "income_category";
const actionUrl = `/auth/${endPoint}/create`;
const redirectUrl = `/auth/${endPoint}`;
const title = "収入カテゴリ追加";
const successMesage = "収入カテゴリ追加に成功しました";

export default createRoute(async (c) => {
  return c.render(
    <>
      <CategoryCreateForm
        title={title}
        actionUrl={actionUrl}
        backUrl={`/auth/${endPoint}`}
      />
    </>,
    { title: title }
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
        />
      );
    }
  }),
  async (c) => {
    const { name } = c.req.valid("form");
    const body = {
      name: name,
    };

    const response = await createItem<IncomeCategory>({
      db: c.env.DB,
      table: endPoint,
      data: body,
    });
    setCookie(c, successAlertCookieKey, successMesage, {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(redirectUrl, 303);
  }
);
