import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Chart.jsの初期化
function initCharts() {
  document.querySelectorAll("canvas[data-chart-type]").forEach((el) => {
    const canvas = el as HTMLCanvasElement;
    const chartType = canvas.dataset.chartType;
    const chartData = JSON.parse(canvas.dataset.chartData || "{}");
    const chartOptions = JSON.parse(canvas.dataset.chartOptions || "{}");

    if (!chartType || !chartData) return;

    // BalanceTransitionChartの特別な処理
    if (canvas.classList.contains("balance-transition-chart")) {
      initBalanceTransitionChart(canvas, chartType, chartData, chartOptions);
    } else {
      // 通常のチャート
      new Chart(canvas, {
        type: chartType as any,
        data: chartData,
        options: chartOptions,
      });
    }
  });
}

// BalanceTransitionChartの初期化と処理
function initBalanceTransitionChart(
  canvas: HTMLCanvasElement,
  chartType: string,
  chartData: any,
  chartOptions: any
) {
  const container = canvas.closest(
    ".balance-transition-chart-container"
  ) as HTMLElement;
  if (!container) return;

  const labels = JSON.parse(canvas.dataset.labels || "[]");
  const incomeAmounts = JSON.parse(canvas.dataset.incomeAmounts || "[]");
  const expenseAmounts = JSON.parse(canvas.dataset.expenseAmounts || "[]");

  let selectedMonth: string | null = null;
  let viewMode: "both" | "income" | "expense" = "both";

  // チャートインスタンスを作成
  const chart = new Chart(canvas, {
    type: chartType as any,
    data: chartData,
    options: {
      ...chartOptions,
      onClick: (event: any, elements: any) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const month = labels[index];
          selectedMonth = selectedMonth === month ? null : month;
          updateDetailDisplay();
        }
      },
    },
  });

  // ボタンのイベントリスナー
  const buttons = container.querySelectorAll(".balance-view-mode-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = (btn as HTMLElement).dataset.mode as
        | "both"
        | "income"
        | "expense";
      viewMode = mode;

      // ボタンのスタイルを更新
      buttons.forEach((b) => {
        b.classList.remove("bg-blue-500", "bg-green-500", "bg-red-500", "text-white");
        b.classList.add("bg-gray-200", "text-gray-700");
      });

      if (mode === "both") {
        btn.classList.remove("bg-gray-200", "text-gray-700");
        btn.classList.add("bg-blue-500", "text-white");
      } else if (mode === "income") {
        btn.classList.remove("bg-gray-200", "text-gray-700");
        btn.classList.add("bg-green-500", "text-white");
      } else if (mode === "expense") {
        btn.classList.remove("bg-gray-200", "text-gray-700");
        btn.classList.add("bg-red-500", "text-white");
      }

      // チャートのデータセットを更新
      updateChartDatasets();
    });
  });

  // チャートのデータセットを更新
  function updateChartDatasets() {
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

    chart.data.datasets = datasets as any;
    chart.update();
  }

  // 詳細表示を更新
  function updateDetailDisplay() {
    const detailContainer = container.querySelector(
      ".balance-detail-container"
    ) as HTMLElement;
    const hint = container.querySelector(".balance-hint") as HTMLElement;

    if (!selectedMonth) {
      detailContainer?.classList.add("hidden");
      hint?.classList.remove("hidden");
      return;
    }

    const index = labels.indexOf(selectedMonth);
    if (index === -1) return;

    const income = incomeAmounts[index];
    const expense = expenseAmounts[index];
    const balance = income - expense;

    const title = container.querySelector(".balance-detail-title");
    const incomeEl = container.querySelector(".balance-detail-income");
    const expenseEl = container.querySelector(".balance-detail-expense");
    const balanceEl = container.querySelector(".balance-detail-balance");

    if (title) title.textContent = `${selectedMonth} の詳細`;
    if (incomeEl) incomeEl.textContent = `¥${income.toLocaleString()}`;
    if (expenseEl) expenseEl.textContent = `¥${expense.toLocaleString()}`;
    if (balanceEl) {
      balanceEl.textContent = `¥${balance.toLocaleString()}`;
      balanceEl.classList.remove("text-green-600", "text-red-600");
      balanceEl.classList.add(balance >= 0 ? "text-green-600" : "text-red-600");
    }

    detailContainer?.classList.remove("hidden");
    hint?.classList.add("hidden");

    // 詳細コンテナをクリックで閉じる
    detailContainer?.addEventListener("click", () => {
      selectedMonth = null;
      updateDetailDisplay();
    });
  }
}

// DOMContentLoadedイベントでチャートを初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCharts);
} else {
  initCharts();
}
