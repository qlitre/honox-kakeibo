import { ArcElement, Legend, Tooltip, Chart as chartJs, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';

const Chart = () => {
  // 必要なコンポーネントを登録
  chartJs.register(ArcElement, Tooltip, Legend);

  // グラフのオプションを定義し、型注釈を追加
  const options: ChartOptions<'pie'> = {
    plugins: {
      legend: {
        display: true,        // 凡例を表示
        position: 'right',    // 凡例の位置を指定
        labels: {
          boxWidth: 20,       // ラベルのボックスサイズ
          padding: 10,        // ラベル間の余白
        },
      },
    },
  };

  const data = {
    labels: ['現金', '日本株式', '株式投信'],
    datasets: [
      {
        label: '資産内訳',
        data: [300, 50, 100],
        backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 205, 86)'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '40px',
      }}
    >
      <div
        style={{
          width: 700,
          height: 300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export const PieChartTest = () => {
  return (
    <>
      <Chart />
    </>
  );
};
