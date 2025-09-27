import { FC } from "react";
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
  holdingValues: number[];
  investmentAmounts: number[];
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

export const InvestmentSummaryChart: FC<Props> = ({
  labels,
  holdingValues,
  investmentAmounts,
}) => {
  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
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
        text: "投資金額推移",
        font: {
          size: 16,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = Number(context.parsed.y).toLocaleString();
            return `${label}: ¥${value}`;
          },
        },
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
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function (value) {
            return "¥" + Number(value).toLocaleString();
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
      bar: {
        borderWidth: 1,
      },
    },
  };

  const data: ChartData<"bar" | "line", number[], string> = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "投資金額",
        data: investmentAmounts,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        type: "line" as const,
        label: "保有価額",
        data: holdingValues,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="w-full" style={{ height: "350px" }}>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
};
