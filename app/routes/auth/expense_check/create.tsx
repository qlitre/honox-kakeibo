import type { Expense } from "@/@types/dbTypes";
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

const endPoint = "expense";
const successMessage = "支出追加に成功しました";
const slackSuccessMessage = "支出が追加されました。";

/* --------------------- バリデーション --------------------- */
const schema = z.object({
  date: z.string().length(10),
  amount: z.string().regex(/^\d+$/), // 数値文字列のみ許可
  expense_category_id: z.string().regex(/^\d+$/),
  payment_method_id: z.string().regex(/^\d+$/),
  description: z.string(),
});

export const POST = createRoute(
  zValidator("form", schema, (result, c) => {
    if (!result.success) {
      // バリデーションエラー時もdateから年月を取得してリダイレクト
      let redirectYear, redirectMonth;
      try {
        const dateValue = result.data.date;
        if (dateValue) {
          const dateObj = new Date(dateValue);
          redirectYear = dateObj.getFullYear().toString();
          redirectMonth = (dateObj.getMonth() + 1).toString();
        } else {
          throw new Error("No date provided");
        }
      } catch {
        // dateが無効な場合は現在の年月を使用
        const now = new Date();
        redirectYear = now.getFullYear().toString();
        redirectMonth = (now.getMonth() + 1).toString();
      }
      
      return c.redirect(`/auth/expense_check?year=${redirectYear}&month=${redirectMonth}`, 303);
    }
  }),
  async (c) => {
    /* フォーム値を取得＆型変換 */
    const {
      date,
      amount,
      expense_category_id,
      payment_method_id,
      description,
    } = c.req.valid("form");

    const data = {
      date,
      amount: Number(amount),
      expense_category_id: Number(expense_category_id),
      payment_method_id: Number(payment_method_id),
      description,
    };

    try {
      const newItem = await createItem<Expense>({
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
支払い方法: ${newItem.payment_method_name}
金額: ${newItem.amount}
詳細: ${newItem.description}
      `.trim();
      await sendSlackNotification(message, c.env.SLACK_WEBHOOK_URL);

      // 入力されたdateから年月を取得してリダイレクトパラメータに設定
      const dateObj = new Date(data.date);
      const redirectYear = dateObj.getFullYear().toString();
      const redirectMonth = (dateObj.getMonth() + 1).toString();
      
      return c.redirect(`/auth/expense_check?year=${redirectYear}&month=${redirectMonth}`, 303);
    } catch (err) {
      console.error(`${endPoint} create error:`, err);
      
      // エラー時もdateから年月を取得してリダイレクト（フォールバック付き）
      let redirectYear, redirectMonth;
      try {
        const dateObj = new Date(data.date);
        redirectYear = dateObj.getFullYear().toString();
        redirectMonth = (dateObj.getMonth() + 1).toString();
      } catch {
        // dateが無効な場合は現在の年月を使用
        const now = new Date();
        redirectYear = now.getFullYear().toString();
        redirectMonth = (now.getMonth() + 1).toString();
      }
      
      return c.redirect(`/auth/expense_check?year=${redirectYear}&month=${redirectMonth}&error=create_failed`, 303);
    }
  },
);
