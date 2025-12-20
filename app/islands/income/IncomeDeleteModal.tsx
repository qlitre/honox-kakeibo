import type { FC } from "hono/jsx";
import type { IncomeWithCategory } from "@/@types/dbTypes";
import { useState } from "hono/jsx";
import { Button } from "@/islands/Button";

type Props = {
  actionUrl: string;
  income: IncomeWithCategory;
};

export const IncomeDeleteModal: FC<Props> = ({ actionUrl, income }) => {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(true);
  };
  return (
    <>
      <Button type="danger" onClick={handleClick}>
        削除
      </Button>
      {open && (
        <div className="fixed inset-0 z-10 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={() => setOpen(false)}
          ></div>

          {/* Dialog Panel */}
          <div className="relative z-20 w-full max-w-md transform overflow-hidden rounded-lg bg-white px-6 py-4 shadow-xl transition-all sm:max-w-lg">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">収入削除</h1>
            <form action={actionUrl} method="post">
              <div className="mb-4">
                <p className="text-lg mb-2">
                  <strong>詳細：</strong> {income.description || "説明なし"}
                </p>
                <p className="text-lg mb-2">
                  <strong>カテゴリ：</strong> {income.category_name}
                </p>
                <p className="text-lg font-semibold">
                  <strong>金額：</strong> {income.amount}円
                </p>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  削除すると元に戻せません。本当に削除しますか？
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    キャンセル
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    削除する
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
