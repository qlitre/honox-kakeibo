import type { FC } from "hono/jsx";
import { PageHeader } from "@/components/PageHeader";

type Data = {
  name: string;
  is_investment?: string;
  error?: Record<string, string[] | undefined>;
};

type Props = {
  data?: Data;
  title: string;
  actionUrl: string;
  backUrl: string;
};

export const CategoryCreateForm: FC<Props> = ({
  data,
  title,
  actionUrl,
  backUrl,
}) => {
  const isInvestmentField = () => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_investment"
          name="is_investment"
          defaultChecked={data?.is_investment === "1"}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          value="1" // チェックされているときは 1 として送信される
        />
        <label
          htmlFor="is_investment"
          className="ml-2 block text-sm text-gray-700"
        >
          投資用カテゴリ
        </label>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title={title}></PageHeader>
      <form action={actionUrl} method="post" className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            カテゴリ名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            defaultValue={data?.name} // defaultValueに変更
          />
          {data?.error?.name && (
            <p className="text-red-500 text-sm mt-1">{data.error.name}</p>
          )}
        </div>
        {
          actionUrl.includes("asset_category") && isInvestmentField() // 関数を直接呼び出して表示
        }
        <div>
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            送信
          </button>
        </div>
      </form>
      <div className="mt-8">
        <a
          href={backUrl}
          className="text-lg text-indigo-600 hover:underline hover:text-indigo-800"
        >
          ← 戻る
        </a>
      </div>
    </div>
  );
};
