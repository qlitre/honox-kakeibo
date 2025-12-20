import type { AssetWithCategory, AssetCategory } from "@/@types/dbTypes";

type Props = {
  assets: AssetWithCategory[];
  categories: AssetCategory[];
  colorMap: Record<number, string>;
};

type Dataset = {
  label: string;
  data: number[];
  backgroundColor?: string;
};

export const AssetBarChart = (props: Props) => {
  const set = new Set();
  const labels = [];
  const datasets: Dataset[] = [];
  // datasetのひな型を作る
  for (let i = 0; i < props.categories.length; i++) {
    const elm = props.categories[i];
    const color = props.colorMap[elm.id];
    datasets.push({ label: elm.name, data: [], backgroundColor: color });
  }
  const obj: Record<string, Record<number, number>> = {};
  // 資産リストを一回繰り返して、labelの作成、{'2024-10':{'1':100,'2':200}}のようなデータを作る
  for (const elm of props.assets) {
    const d = elm.date.slice(0, 7);
    if (!set.has(d)) {
      labels.push(d);
      set.add(d);
      obj[d] = {};
    }
    const category_id = elm.asset_category_id;
    const amount = elm.amount;
    obj[d][category_id] = amount;
  }
  // ラベルを繰り返してカテゴリごとにデータを加えていく
  for (const d of labels) {
    const o = obj[d];
    for (let i = 0; i < props.categories.length; i++) {
      const amount = o[props.categories[i].id] ?? 0;
      datasets[i].data.push(amount);
    }
  }

  // データの設定
  const data = {
    labels: labels, // x軸のラベル
    datasets: datasets,
  };

  // オプションの設定
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top", // 凡例の位置
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 11,
        },
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = Number(context.parsed.y).toLocaleString();
            return `${label}: ¥${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true, // x軸のスタックを有効にする
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        stacked: true, // y軸のスタックを有効にする
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function (value: any) {
            return "¥" + Number(value).toLocaleString();
          },
        },
      },
    },
    elements: {
      bar: {
        borderWidth: 0,
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <canvas
        className="chart-canvas"
        data-chart-type="bar"
        data-chart-data={JSON.stringify(data)}
        data-chart-options={JSON.stringify(options)}
      />
    </div>
  );
};
