import type { FC } from "react";
import type { AssetWithCategory } from "@/@types/dbTypes";
import {
  ArcElement,
  Legend,
  Tooltip,
  Chart as chartJs,
  ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";

type Props = {
  assets: AssetWithCategory[];
  colorMap: Record<number, string>;
};

export const AssetPieChart: FC<Props> = (props) => {
  // 必要なコンポーネントを登録
  chartJs.register(ArcElement, Tooltip, Legend);

  // グラフのオプションを定義し、型注釈を追加
  const options: ChartOptions<"pie"> = {
    plugins: {
      legend: {
        display: true, // 凡例を表示
        position: "top", // 凡例の位置を指定
        labels: {
          boxWidth: 20, // ラベルのボックスサイズ
          padding: 10, // ラベル間の余白
        },
      },
    },
    responsive: true,
  };

  const labels = [];
  const amounts = [];
  const colors = [];
  for (let i = 0; i < props.assets.length; i++) {
    const elm = props.assets[i];
    const categoryName = elm.category_name;
    const amount = elm.amount;
    labels.push(categoryName);
    amounts.push(amount);
    colors.push(props.colorMap[elm.asset_category_id]);
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "資産内訳",
        data: amounts,
        backgroundColor: colors,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div>
      <Pie data={data} options={options} />
    </div>
  );
};
