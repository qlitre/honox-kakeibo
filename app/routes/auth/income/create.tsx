import type { Income } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { setCookie } from "hono/cookie";
import {
  alertCookieMaxage,
  successAlertCookieKey,
} from "@/settings/kakeiboSettings";
import { sendSlackNotification } from "@/libs/slack";
import { createItem } from "@/libs/dbService";

const endPoint = "income";
const successMessage = "収入追加に成功しました";
const slackSuccessMessage = "収入が追加されました。";

/* --------------------- バリデーション --------------------- */
const schema = z.object({
  date: z.string().length(10),
  amount: z.string().regex(/^\d+$/), // 数値文字列のみ許可
  income_category_id: z.string().regex(/^\d+$/),
  description: z.string(),
});

/* --------------------- ルート --------------------- */
export const POST = createRoute(
  zValidator("form", schema, (result, c) => {
    if (!result.success) {
      return c.redirect(`/auth/${endPoint}`, 303); // バリデーションエラー
    }
  }),
  async (c) => {
    /* フォーム値を取得＆型変換 */
    const { date, amount, income_category_id, description } =
      c.req.valid("form");

    const data = {
      date,
      amount: Number(amount),
      income_category_id: Number(income_category_id),
      description,
    };

    try {
      const newItem = await createItem<Income>({
        db: c.env.DB,
        table: endPoint,
        data,
      });

      /* ---------- 成功後の処理 ---------- */
      setCookie(c, successAlertCookieKey, successMessage, {
        maxAge: alertCookieMaxage,
      });

      const message = `
${slackSuccessMessage}
${newItem.date}
カテゴリ: ${newItem.category_name}
金額: ${newItem.amount}
詳細: ${newItem.description}
      `.trim();
      await sendSlackNotification(message, c.env.SLACK_WEBHOOK_URL);

      return c.redirect(`/auth/${endPoint}?lastUpdate=${newItem.id}`, 303);
    } catch (err) {
      console.error(`${endPoint} create error:`, err);
      return c.json({ error: `Failed to add ${endPoint}` }, 500);
    }
  },
);
