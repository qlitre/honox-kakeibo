import type { FC } from 'react';
import type { SummaryItem } from '@/@types/dbTypes';
import { ArcElement, Legend, Tooltip, Chart as chartJs, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';

type Props = {
  items: SummaryItem[]
  colorMap: Record<number, string>
}

export const ExpensePieChart: FC<Props> = (props) => {
  chartJs.register(ArcElement, Tooltip, Legend);

  const options: ChartOptions<'pie'> = {
    plugins: {
      legend: {
        display: true,        // 凡例を表示
        position: 'top',    // 凡例の位置を指定
        labels: {
          boxWidth: 20,       // ラベルのボックスサイズ
          padding: 10,        // ラベル間の余白
        },
      },
    },
    responsive: true
  };

  const labels = []
  const amounts = []
  const colors: string[] = []
  for (let i = 0; i < props.items.length; i++) {
    const elm = props.items[i]
    const categoryName = elm.category_name
    const amount = elm.total_amount
    labels.push(categoryName)
    amounts.push(amount)
    colors.push(props.colorMap[elm.category_id])
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: '支出内訳',
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
