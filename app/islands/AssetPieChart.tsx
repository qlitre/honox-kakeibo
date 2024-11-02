import { ArcElement, Legend, Tooltip, Chart as chartJs, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { AssetWithCategory } from '../@types/dbTypes';

type Props = {
  assets: AssetWithCategory[]
}

// python seabornより sns paired
const colorSchema = ['rgb(166.65098039215687,206.8078431372549,227.89019607843136)',
  'rgb(31.12156862745098,120.47058823529412,180.7058823529412)',
  'rgb(178.69803921568626,223.87450980392157,138.54117647058823)',
  'rgb(51.2,160.62745098039215,44.17254901960784)',
  'rgb(251.98431372549018,154.60392156862744,153.6)',
  'rgb(227.89019607843136,26.101960784313725,28.109803921568627)',
  'rgb(253.9921568627451,191.74901960784314,111.43529411764706)',
  'rgb(256.0,127.49803921568628,0.0)',
  'rgb(202.7921568627451,178.69803921568626,214.8392156862745)',
  'rgb(106.41568627450981,61.23921568627451,154.60392156862744)',
  'rgb(256.0,256.0,153.6)',
  'rgb(177.69411764705882,89.34901960784313,40.15686274509804)',
  'rgb(166.65098039215687,206.8078431372549,227.89019607843136)',
  'rgb(31.12156862745098,120.47058823529412,180.7058823529412)',
  'rgb(178.69803921568626,223.87450980392157,138.54117647058823)',
  'rgb(51.2,160.62745098039215,44.17254901960784)',
  'rgb(251.98431372549018,154.60392156862744,153.6)',
  'rgb(227.89019607843136,26.101960784313725,28.109803921568627)',
  'rgb(253.9921568627451,191.74901960784314,111.43529411764706)',
  'rgb(256.0,127.49803921568628,0.0)',
  'rgb(202.7921568627451,178.69803921568626,214.8392156862745)',
  'rgb(106.41568627450981,61.23921568627451,154.60392156862744)',
  'rgb(256.0,256.0,153.6)',
  'rgb(177.69411764705882,89.34901960784313,40.15686274509804)']

export const AssetPieChart = (props: Props) => {
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

  const labels = []
  const amounts = []
  const colors = []
  for (let i = 0; i < props.assets.length; i++) {
    const elm = props.assets[i]
    const categoryName = elm.category_name
    const amount = elm.amount
    labels.push(categoryName)
    amounts.push(amount)
    colors.push(colorSchema[i])
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: '資産内訳',
        data: amounts,
        backgroundColor: colors,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Pie data={data} options={options} />
  );
};
