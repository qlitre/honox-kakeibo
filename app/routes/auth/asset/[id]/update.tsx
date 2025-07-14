import type { Asset, AssetWithCategoryResponse } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { setCookie } from "hono/cookie";
import {
  successAlertCookieKey,
  dangerAlertCookieKey,
  alertCookieMaxage,
} from "@/settings/kakeiboSettings";
import { updateItem, fetchDetail, fetchListWithFilter } from "@/libs/dbService";
import { getBeginningOfMonth, getEndOfMonth } from "@/utils/dashboardUtils";

/* ---------- ルート固有設定 ---------- */
const endPoint = "asset";
const successMessage = "資産編集に成功しました";

/* ---------- バリデーション ---------- */
const schema = z.object({
  date: z.string().length(10),
  amount: z.string().regex(/^\d+$/),
  asset_category_id: z.string().regex(/^\d+$/),
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
    const { date, amount, asset_category_id, description } =
      c.req.valid("form");
    const oldData = await fetchDetail<Asset>({
      db: c.env.DB,
      table: endPoint,
      id: recordId,
    });
    const oldCategoryId = oldData?.asset_category_id;
    if (oldCategoryId != parseInt(asset_category_id, 10)) {
      const [yearStr, monthStr] = date.split("-");
      const year = parseInt(yearStr, 10); // 年
      const month = parseInt(monthStr, 10); // 月
      const ge = getBeginningOfMonth(year, month);
      const le = getEndOfMonth(year, month);
      const r = await fetchListWithFilter<AssetWithCategoryResponse>({
        db: c.env.DB,
        table: endPoint,
        filters: `asset_category_id[eq]${asset_category_id}[and]date[greater_equal]${ge}[and]date[less_equal]${le}`,
        limit: 10,
        offset: 0,
      });
      if (r.totalCount > 0) {
        setCookie(
          c,
          dangerAlertCookieKey,
          "資産編集に失敗しました。同月に同カテゴリの資産が登録されています。",
          { maxAge: alertCookieMaxage }
        );
        return c.redirect("/auth/asset", 303);
      }
    }

    const data = {
      date,
      amount: Number(amount),
      asset_category_id: Number(asset_category_id),
      description,
    };

    try {
      /* 3. 更新処理（D1 直接） */
      await updateItem<Asset>({
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
        303
      );
    } catch (err) {
      console.error(`${endPoint} update error:`, err);
      return c.json({ error: `Failed to update ${endPoint}` }, 500);
    }
  }
);
