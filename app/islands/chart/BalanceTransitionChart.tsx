import type { FC } from "react";
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
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";

type Props = {
  labels: string[];
  incomeAmounts: number[];
  expenseAmounts: number[];
};

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

export const BalanceTransitionChart: FC<Props> = ({
  labels,
  incomeAmounts,
  expenseAmounts,
}) => {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "収支",
        font: {
          size: 16,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        display: true,
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
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value) {
            return '¥' + Number(value).toLocaleString();
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
      },
      line: {
        borderWidth: 2,
      },
    },
  };

  const data: ChartData<"line", number[], string> = {
    labels,
    datasets: [
      {
        type: "line" as const,
        label: "収入",
        data: incomeAmounts,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
      },
      {
        type: "line" as const,
        label: "支出",
        data: expenseAmounts,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="w-full" style={{ height: '300px' }}>
      <Chart type="line" data={data} options={options} />
    </div>
  );
};
