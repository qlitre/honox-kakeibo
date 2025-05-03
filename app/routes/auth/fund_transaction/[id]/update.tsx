import type { FundTransation } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";
import { updateItem } from "@/libs/dbService";

/* ---------- ルート固有設定 ---------- */
const endPoint = "fund_transaction";
const successMessage = "投資用口座入金履歴編集に成功しました";

/* ---------- バリデーション ---------- */
const schema = z.object({
  date: z.string().length(10),
  amount: z.string().regex(/^\d+$/),
  description: z.string(),
});

/* ---------- ルート ---------- */
export const POST = createRoute(
  zValidator("form", schema, (result, c) => {
    if (!result.success) {
      return c.redirect(`/auth/${endPoint}`, 303);
    }
  }),
  async (c) => {
    /* 1. パラメータ */
    const recordId = Number(c.req.param("id"));
    const queryString = c.req.url.split("?")[1] ?? "";

    /* 2. フォーム値を取得＆型変換 */
    const { date, amount, description } = c.req.valid("form");
    const data = {
      date,
      amount: Number(amount),
      description,
    };

    try {
      /* 3. 更新処理（D1 直接） */
      await updateItem<FundTransation>({
        db: c.env.DB,
        table: endPoint,
        id: recordId,
        data,
      });

      /* 4. Cookie & リダイレクト */
      setCookie(c, successAlertCookieKey, successMessage, {
        maxAge: alertCookieMaxage,
      });

      return c.redirect(
        `/auth/${endPoint}?lastUpdate=${recordId}&${queryString}`,
        303,
      );
    } catch (err) {
      console.error(`${endPoint} update error:`, err);
      return c.json({ error: `Failed to update ${endPoint}` }, 500);
    }
  },
);
