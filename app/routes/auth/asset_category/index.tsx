import type { AssetCategory } from "@/@types/dbTypes";
import { createRoute } from "honox/factory";
import { fetchSimpleList } from "@/libs/dbService";
import { getCookie } from "hono/cookie";
import { successAlertCookieKey } from "@/settings/kakeiboSettings";
import { CategoryList } from "@/components/share/CategoryList";

export default createRoute(async (c) => {  
  const message = getCookie(c, successAlertCookieKey);
  const pageTitle = "資産カテゴリ一覧";
  const endPoint = "asset_category";
  const categories = await fetchSimpleList<AssetCategory>({db:c.env.DB,table:endPoint})
  return c.render(
    <>
      <CategoryList
        message={message}
        categories={categories.contents}
        pageTitle={pageTitle}
        endpoint={endPoint}
      ></CategoryList>
    </>,
    { title: pageTitle },
  );
});
