
import { FC } from 'react';
import {
    Chart as ChartJS,
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    LineController,
    BarController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

type Props = {
    labels: string[]
    holdingValues: number[]
    investmentAmounts: number[]
}

ChartJS.register(
    BarElement,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    LineController,
    BarController,
);

export const InvestmentSummaryChart: FC<Props> = ({ labels, holdingValues, investmentAmounts }) => {
    const options: ChartOptions<"bar" | "line"> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: '投資金額推移',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const data: ChartData<"bar" | "line", number[], string> = {
        labels,
        datasets: [
            {
                type: 'bar' as const,
                label: '投資金額',
                data: investmentAmounts,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                type: 'line' as const,
                label: '保有価額',
                data: holdingValues,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.4,
            },
        ],
    };

    return <Chart type="bar" data={data} options={options} />;
};


