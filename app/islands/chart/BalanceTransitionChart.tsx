
import type { FC } from 'react';
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
    incomeAmounts: number[]
    expenseAmounts: number[]
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

export const BalanceTransitionChart: FC<Props> = ({ labels, incomeAmounts, expenseAmounts }) => {
    const options: ChartOptions<"line"> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: '収支',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const data: ChartData<"line", number[], string> = {
        labels,
        datasets: [
            {
                type: 'line' as const,
                label: '収入',
                data: incomeAmounts,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4,
            },
            {
                type: 'line' as const,
                label: '支出',
                data: expenseAmounts,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                tension: 0.4,
            },
        ],
    };

    return <Chart type="line" data={data} options={options} />;
};


