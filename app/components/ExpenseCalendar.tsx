import type { FC } from "hono/jsx";

type Props = {
  year: number;
  month: number;
  dailyExpenses: Record<string, number>;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export const ExpenseCalendar: FC<Props> = ({
  year,
  month,
  dailyExpenses,
}) => {
  // 月の初日の曜日 (0=日, 1=月, ..., 6=土)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // 月の日数
  const daysInMonth = new Date(year, month, 0).getDate();

  // カレンダーのセル配列を作成（前月の空白 + 日付）
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  // 月合計
  const monthTotal = Object.values(dailyExpenses).reduce(
    (sum, v) => sum + v,
    0,
  );

  const formatDate = (day: number) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  return (
    <div>
      {/* 月合計 */}
      <div className="mb-4 text-right">
        <span className="text-sm text-gray-500">月合計</span>
        <span className="ml-2 text-xl font-bold text-gray-900">
          ¥{monthTotal.toLocaleString()}
        </span>
      </div>

      {/* カレンダーグリッド */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-300">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-xs font-semibold ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                      ? "text-blue-500"
                      : "text-gray-600"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日付セル */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="border-b border-r border-gray-100 p-1 min-h-[60px] sm:min-h-[80px]"
                  />
                );
              }

              const dateStr = formatDate(day);
              const amount = dailyExpenses[dateStr] ?? 0;
              const dayOfWeek = (firstDayOfWeek + day - 1) % 7;

              return (
                <div
                  key={day}
                  className={`border-b border-r border-gray-100 p-1 min-h-[60px] sm:min-h-[80px] ${
                    amount > 0 ? "bg-red-50" : ""
                  }`}
                >
                  <div
                    className={`text-xs font-medium ${
                      dayOfWeek === 0
                        ? "text-red-500"
                        : dayOfWeek === 6
                          ? "text-blue-500"
                          : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                  {amount > 0 && (
                    <div className="mt-1 text-xs sm:text-sm font-semibold text-red-600">
                      ¥{amount.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
