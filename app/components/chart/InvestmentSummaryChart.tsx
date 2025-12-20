type Props = {
  labels: string[];
  holdingValues: number[];
  investmentAmounts: number[];
};

export const InvestmentSummaryChart = ({
  labels,
  holdingValues,
  investmentAmounts,
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
      bar: {
        borderWidth: 1,
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "投資金額",
        data: investmentAmounts,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        type: "line",
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
      <canvas
        className="chart-canvas"
        data-chart-type="bar"
        data-chart-data={JSON.stringify(data)}
        data-chart-options={JSON.stringify(options)}
      />
    </div>
  );
};
