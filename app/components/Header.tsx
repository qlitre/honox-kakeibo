import type { FC } from "hono/jsx";
import { FlyoutMenu } from "@/islands/FlyoutMenu";
import { kakeiboMenu } from "@/settings/kakeiboSettings";

export const Header: FC = () => {
  // kakeiboMenu を取得
  const menuItems = kakeiboMenu();

  // メニューセクションを動的に生成
  const menuSections = Object.entries(menuItems).map(([title, items]) => (
    <FlyoutMenu key={title} title={title} items={items} />
  ));

  return (
    <header className="p-4 mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="container mx-auto flex items-center relative">
        <h1 className="text-2xl font-bold">
          <a href="/auth">SIMPLE KAKEIBO</a>
        </h1>

        {/* md以上の画面幅で表示されるナビゲーションメニュー */}
        <nav className="ml-auto hidden md:flex items-center space-x-8">
          {menuSections}
          <a href="/auth/logout" className="text-sm font-semibold">
            ログアウト
          </a>
        </nav>
      </div>
    </header>
  );
};
