type Props = {
  labels: string[];
  incomeAmounts: number[];
  expenseAmounts: number[];
};

export const BalanceTransitionChart = ({
  labels,
  incomeAmounts,
  expenseAmounts,
}: Props) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
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
          callback: function (value: any) {
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

  // 初期状態は両方表示
  const datasets = [
    {
      type: "line",
      label: "収入",
      data: incomeAmounts,
      backgroundColor: "rgba(75, 192, 192, 0.5)",
      borderColor: "rgba(75, 192, 192, 1)",
      tension: 0.4,
    },
    {
      type: "line",
      label: "支出",
      data: expenseAmounts,
      borderColor: "rgba(255, 99, 132, 1)",
      backgroundColor: "rgba(255, 99, 132, 0.5)",
      tension: 0.4,
    },
  ];

  const data = {
    labels,
    datasets,
  };

  return (
    <div className="w-full balance-transition-chart-container">
      <div className="mb-4 flex flex-wrap gap-2 justify-center sm:justify-start">
        <button
          className="balance-view-mode-btn px-3 py-1 rounded-md text-sm font-medium transition-colors bg-blue-500 text-white"
          data-mode="both"
        >
          両方
        </button>
        <button
          className="balance-view-mode-btn px-3 py-1 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
          data-mode="income"
        >
          収入のみ
        </button>
        <button
          className="balance-view-mode-btn px-3 py-1 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
          data-mode="expense"
        >
          支出のみ
        </button>
      </div>

      <div className="balance-detail-container hidden mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 balance-detail-title"></h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm sm:gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">収入:</span>
            <span className="font-medium text-green-600 balance-detail-income"></span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">支出:</span>
            <span className="font-medium text-red-600 balance-detail-expense"></span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">収支:</span>
            <span className="font-medium balance-detail-balance"></span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">クリックで詳細を非表示</p>
      </div>

      <div style={{ height: "300px" }} className="cursor-pointer relative overflow-hidden">
        <canvas
          className="chart-canvas balance-transition-chart"
          data-chart-type="line"
          data-chart-data={JSON.stringify(data)}
          data-chart-options={JSON.stringify(options)}
          data-labels={JSON.stringify(labels)}
          data-income-amounts={JSON.stringify(incomeAmounts)}
          data-expense-amounts={JSON.stringify(expenseAmounts)}
        />
      </div>

      <p className="balance-hint text-center text-sm text-gray-500 mt-2">
        グラフの点をクリックすると詳細を表示します
      </p>
    </div>
  );
};
