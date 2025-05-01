import type { Expense } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { KakeiboClient } from "@/libs/kakeiboClient";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";

const schema = z.object({
  date: z.string().length(10),
  amount: z.string(),
  expense_category_id: z.string(),
  payment_method_id: z.string(),
  description: z.string(),
});

export const POST = createRoute(
  zValidator("form", schema, async (result, c) => {
    // 作成と同様に失敗した時をどうするか。
    if (!result.success) {
      c.redirect("/auth/expense", 303);
    }
  }),
  async (c) => {
    const id = c.req.param("id");
    const redirectPage = c.req.query("redirectPage");
    const client = new KakeiboClient({
      token: c.env.HONO_IS_COOL,
      baseUrl: new URL(c.req.url).origin,
    });
    const {
      date,
      amount,
      expense_category_id,
      payment_method_id,
      description,
    } = c.req.valid("form");
    const parsedAmount = Number(amount);
    const parsedCategoryId = Number(expense_category_id);
    const parsedPaymentMethodId = Number(payment_method_id);
    if (
      isNaN(parsedAmount) ||
      isNaN(parsedCategoryId) ||
      isNaN(parsedPaymentMethodId)
    ) {
      return c.json({ error: "Invalid number format" }, 400);
    }
    const body = {
      date: date,
      amount: parsedAmount,
      expense_category_id: parsedCategoryId,
      payment_method_id: parsedPaymentMethodId,
      description: description,
    };
    const queryString = c.req.url.split("?")[1] || "";
    const response = await client
      .updateData<Expense>({ endpoint: "expense", contentId: id, data: body })
      .catch((e) => {
        console.error(e);
      });
    setCookie(c, successAlertCookieKey, "支出編集に成功しました", {
      maxAge: alertCookieMaxage,
    });
    return c.redirect(`/auth/expense?lastUpdate=${id}&${queryString}`, 303);
  },
);
