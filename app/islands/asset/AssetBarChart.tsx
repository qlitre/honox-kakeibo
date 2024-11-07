import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import type { AssetWithCategory, AssetCategory } from '@/@types/dbTypes';
import { colorSchema } from '@/settings/kakeiboSettings';
import { color } from 'chart.js/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Props = {
    assets: AssetWithCategory[]
    categories: AssetCategory[]
    colorMap: Record<number, string>
}

type Dataset = {
    label: string;
    data: number[];
    backgroundColor?: string;
}


export const AssetBarChart = (props: Props) => {
    const set = new Set()
    const labels = []
    const datasets: Dataset[] = []
    // datasetのひな型を作る
    for (let i = 0; i < props.categories.length; i++) {
        const elm = props.categories[i]
        const color = props.colorMap[elm.id]
        datasets.push({ label: elm.name, data: [], backgroundColor: color })
    }
    const obj: Record<string, Record<number, number>> = {};
    // 資産リストを一回繰り返して、labelの作成、{'2024-10':{'1':100,'2':200}}のようなデータを作る
    for (const elm of props.assets) {
        const d = elm.date.slice(0, 7)
        if (!set.has(d)) {
            labels.push(d)
            set.add(d)
            obj[d] = {}
        }
        const category_id = elm.asset_category_id
        const amount = elm.amount
        obj[d][category_id] = amount
    }
    // ラベルを繰り返してカテゴリごとにデータを加えていく
    for (const d of labels) {
        const o = obj[d]
        for (let i = 0; i < props.categories.length; i++) {
            const amount = o[props.categories[i].id] ?? 0
            datasets[i].data.push(amount)
        }
    }

    // データの設定
    const data = {
        labels: labels, // x軸のラベル
        datasets: datasets,
    };

    // オプションの設定
    const options: ChartOptions<'bar'> = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'top', // 凡例の位置
            },
            title: {
                display: true,
                text: '資産のスタック棒グラフ', // タイトル
            },
        },
        scales: {
            x: {
                stacked: true, // x軸のスタックを有効にする
            },
            y: {
                stacked: true, // y軸のスタックを有効にする
            },
        },
    };

    return (
        <div className='h-80'>
            <Bar data={data} options={options} />;
        </div>
    )
};
