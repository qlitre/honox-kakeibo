import type { Expense } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { KakeiboClient } from "@/libs/kakeiboClient";
import { setCookie } from "hono/cookie";
import {
  alertCookieMaxage,
  successAlertCookieKey,
} from "@/settings/kakeiboSettings";
import { sendSlackNotification } from "@/libs/slack";

const schema = z.object({
  date: z.string().length(10),
  amount: z.string(),
  expense_category_id: z.string(),
  payment_method_id: z.string(),
  description: z.string(),
});

export const POST = createRoute(
  zValidator("form", schema, async (result, c) => {
    // 万が一失敗した時の考慮をどうするか。
    if (!result.success) {
      c.redirect("/auth/expense", 303);
    }
  }),
  async (c) => {
    const client = new KakeiboClient({
      token: c.env.HONO_IS_COOL,
      baseUrl: new URL(c.req.url).origin
      ,
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
    const response = await client
      .addData<Expense>({ endpoint: "expense", data: body })
      .catch((e) => {
        console.error(e);
      });
    if (response) {
      setCookie(c, successAlertCookieKey, "支出追加に成功しました", {
        maxAge: alertCookieMaxage,
      });
      const message = `
支出が追加されました。
${response.date}
カテゴリ:${response.category_name}
支払い方法：${response.payment_method_name}
金額：${response.amount}
詳細：${response.description}
            `;
      await sendSlackNotification(message, c.env.SLACK_WEBHOOK_URL);
      return c.redirect(`/auth/expense?lastUpdate=${response.id}`, 303);
    }
  },
);
