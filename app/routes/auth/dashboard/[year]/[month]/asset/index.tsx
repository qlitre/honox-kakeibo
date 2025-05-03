import type { AssetWithCategory, AssetCategory } from "@/@types/dbTypes";
import type { AssetTableItems } from "@/@types/common";
import { createRoute } from "honox/factory";
import { fetchListWithFilter, fetchSimpleList } from "@/libs/dbService";
import { AssetPieChart } from "@/islands/chart/AssetPieChart";
import { AssetBarChart } from "@/islands/chart/AssetBarChart";
import {
  getPrevMonthYear,
  getPrevMonth,
  getBeginningOfMonth,
  getEndOfMonth,
  getAnnualStartYear,
} from "@/utils/dashboardUtils";
import { annualStartMonth } from "@/settings/kakeiboSettings";
import { PageHeader } from "@/components/PageHeader";
import { MonthPager } from "@/components/MonthPager";
import { colorSchema } from "@/settings/kakeiboSettings";
import { Card } from "@/components/share/Card";
import { AssetTable } from "@/components/AssetTable";

export default createRoute(async (c) => {
  const db = c.env.DB;
  const year = parseInt(c.req.param("year"));
  const month = parseInt(c.req.param("month"));
  const ge = getBeginningOfMonth(year, month);
  const le = getEndOfMonth(year, month);

  const asset = await fetchListWithFilter<AssetWithCategory>({
    db: db,
    table: "asset",
    filters: `date[greater_equal]${ge}[and]date[less_equal]${le}`,
    limit: 100,
    offset: 0,
  });

  // 前月
  const prevYear = getPrevMonthYear(year, month);
  const prevMonth = getPrevMonth(month);
  const prevGe = getBeginningOfMonth(prevYear, prevMonth);
  const prevLe = getEndOfMonth(prevYear, prevMonth);
  const prevAsset = await fetchListWithFilter<AssetWithCategory>({
    db: db,
    table: "asset",
    filters: `date[greater_equal]${prevGe}[and]date[less_equal]${prevLe}`,
    limit: 100,
    offset: 0,
  });
  // 年初
  const annualStartYear = getAnnualStartYear(year, month);
  const annualStartGe = getBeginningOfMonth(annualStartYear, annualStartMonth);
  const annualStartLe = getEndOfMonth(annualStartYear, annualStartMonth);
  const annualStartAsset = await fetchListWithFilter<AssetWithCategory>({
    db: db,
    table: "asset",
    filters: `date[greater_equal]${annualStartGe}[and]date[less_equal]${annualStartLe}`,
    limit: 100,
    offset: 0,
  });

  const tableItems: AssetTableItems = {};
  // 当月の記入
  for (const elm of asset.contents) {
    const categoryId = elm.asset_category_id;
    tableItems[categoryId] = {
      categoryName: elm.category_name,
      now: elm.amount,
      prevDiff: 0,
      prevDiffRatio: 0,
      annualStartDiff: 0,
      annualStartDiffRatio: 0,
    };
  }
  // 前月の記入
  for (const elm of prevAsset.contents) {
    const categoryId = elm.asset_category_id;
    if (categoryId in tableItems) {
      const obj = tableItems[categoryId];
      const diff = obj.now - elm.amount;
      obj.prevDiff = diff;
      obj.prevDiffRatio = diff / elm.amount;
    } else {
      tableItems[categoryId] = {
        categoryName: elm.category_name,
        now: 0,
        prevDiff: -1 * elm.amount,
        prevDiffRatio: -1,
        annualStartDiff: 0,
        annualStartDiffRatio: 0,
      };
    }
  }
  // 年初の記入
  for (const elm of annualStartAsset.contents) {
    const categoryId = elm.asset_category_id;
    if (categoryId in tableItems) {
      const obj = tableItems[categoryId];
      const diff = obj.now - elm.amount;
      obj.annualStartDiff = diff;
      obj.annualStartDiffRatio = diff / elm.amount;
    } else {
      tableItems[categoryId] = {
        categoryName: elm.category_name,
        now: 0,
        prevDiff: 0,
        prevDiffRatio: 0,
        annualStartDiff: -1 * elm.amount,
        annualStartDiffRatio: -1,
      };
    }
  }

  // 合計金額の計算
  const totalAmount = asset.contents.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const prevTotalAmount = prevAsset.contents.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const prevTotalDiff = totalAmount - prevTotalAmount;
  const prevTotalDiffRatio = prevTotalDiff / prevTotalAmount;
  const annualTotalAmount = annualStartAsset.contents.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const annualTotalDiff = totalAmount - annualTotalAmount;
  const annualTotalDiffRatio = annualTotalDiff / annualTotalAmount;

  // BarChart用のデータの取得
  const preReq = await fetchListWithFilter<AssetWithCategory>({
    db: db,
    table: "asset",
    limit: 1,
    offset: 0,
  });
  const totalCount = preReq.totalCount;
  const allAssets = await fetchListWithFilter<AssetWithCategory>({
    db: db,
    table: "asset",
    limit: totalCount,
    offset: 0,
  });

  // カテゴリ一覧取得
  const categories = await fetchSimpleList<AssetCategory>({
    db,
    table: "asset_category",
    orders: "updated_at",
  });

  const colormap: Record<number, string> = {};
  for (let i = 0; i < categories.contents.length; i++) {
    const categoryId = categories.contents[i].id;
    const color = colorSchema[i];
    colormap[categoryId] = color;
  }

  return c.render(
    <div>
      <PageHeader title="資産ダッシュボード"></PageHeader>
      <MonthPager year={year} month={month} hrefSuffix="asset"></MonthPager>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* テーブル部分：2 の割合 */}
        <Card className="lg:col-span-2">
          <AssetTable
            totalAmount={totalAmount}
            prevTotalDiff={prevTotalDiff}
            annualTotalDiff={annualTotalDiff}
            prevTotalDiffRatio={prevTotalDiffRatio}
            annualTotalDiffRatio={annualTotalDiffRatio}
            tableItems={tableItems}
          />
        </Card>
        {/* PieChart 部分：1 の割合 */}
        <Card>
          <div className="w-full">
            <AssetPieChart
              assets={asset.contents}
              colorMap={colormap}
            ></AssetPieChart>
          </div>
        </Card>
      </div>
      <Card>
        <AssetBarChart
          assets={allAssets.contents}
          categories={categories.contents}
          colorMap={colormap}
        />
      </Card>
    </div>,
    { title: "資産ダッシュボード" },
  );
});
