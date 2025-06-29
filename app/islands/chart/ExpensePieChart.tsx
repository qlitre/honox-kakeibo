import type { FC } from "react";
import type { SummaryItem } from "@/@types/dbTypes";
import {
  ArcElement,
  Legend,
  Tooltip,
  Chart as chartJs,
  ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";

type Props = {
  items: SummaryItem[];
  colorMap: Record<number, string>;
};

export const ExpensePieChart: FC<Props> = (props) => {
  chartJs.register(ArcElement, Tooltip, Legend);

  const options: ChartOptions<"pie"> = {
    plugins: {
      legend: {
        display: true, // 凡例を表示
        position: "bottom", // スマホ対応で下に配置
        labels: {
          boxWidth: 12, // 小さく調整
          padding: 8, // パディング調整
          font: {
            size: 11, // フォントサイズを小さく
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = Number(context.parsed).toLocaleString();
            return `${label}: ¥${value}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const labels = [];
  const amounts = [];
  const colors: string[] = [];
  for (let i = 0; i < props.items.length; i++) {
    const elm = props.items[i];
    const categoryName = elm.category_name;
    const amount = elm.total_amount;
    labels.push(categoryName);
    amounts.push(amount);
    colors.push(props.colorMap[elm.category_id]);
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "支出内訳",
        data: amounts,
        backgroundColor: colors,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="w-full" style={{ height: '280px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};
