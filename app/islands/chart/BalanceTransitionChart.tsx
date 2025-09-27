import type { FC } from "react";
import { useState } from "react";
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

type ViewMode = "both" | "income" | "expense";

export const BalanceTransitionChart: FC<Props> = ({
  labels,
  incomeAmounts,
  expenseAmounts,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const month = labels[index];
        setSelectedMonth(selectedMonth === month ? null : month);
      }
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    },
  };

  const datasets = [];

  if (viewMode === "both" || viewMode === "income") {
    datasets.push({
      type: "line" as const,
      label: "収入",
      data: incomeAmounts,
      backgroundColor: "rgba(75, 192, 192, 0.5)",
      borderColor: "rgba(75, 192, 192, 1)",
      tension: 0.4,
    });
  }

  if (viewMode === "both" || viewMode === "expense") {
    datasets.push({
      type: "line" as const,
      label: "支出",
      data: expenseAmounts,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      tension: 0.4,
    });
  }

  const data: ChartData<"line", number[], string> = {
    labels,
    datasets,
  };

  const getSelectedMonthData = () => {
    if (!selectedMonth) return null;
    const index = labels.indexOf(selectedMonth);
    if (index === -1) return null;
    return {
      month: selectedMonth,
      income: incomeAmounts[index],
      expense: expenseAmounts[index],
      balance: incomeAmounts[index] - expenseAmounts[index],
    };
  };

  const selectedData = getSelectedMonthData();

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-2 justify-center sm:justify-start">
        <button
          onClick={() => setViewMode("both")}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === "both"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          両方
        </button>
        <button
          onClick={() => setViewMode("income")}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === "income"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          収入のみ
        </button>
        <button
          onClick={() => setViewMode("expense")}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            viewMode === "expense"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          支出のみ
        </button>
      </div>

      {selectedData && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {selectedData.month} の詳細
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm sm:gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600">収入:</span>
              <span className="font-medium text-green-600">
                ¥{selectedData.income.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">支出:</span>
              <span className="font-medium text-red-600">
                ¥{selectedData.expense.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">収支:</span>
              <span
                className={`font-medium ${selectedData.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ¥{selectedData.balance.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">クリックで詳細を非表示</p>
        </div>
      )}

      <div
        style={{ height: "300px" }}
        className="cursor-pointer relative overflow-hidden"
      >
        <Chart type="line" data={data} options={options} />
      </div>

      {!selectedData && (
        <p className="text-center text-sm text-gray-500 mt-2">
          グラフの点をクリックすると詳細を表示します
        </p>
      )}
    </div>
  );
};
