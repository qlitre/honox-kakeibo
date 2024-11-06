import { createRoute } from 'honox/factory';
import { kakeiboMenu } from '@/settings/kakeiboSettings';

type MenuItem = {
  name: string;
  href: string;
}

type Props = {
  title: string
  items: MenuItem[]
}

const MenuSection = ({ title, items }: Props) => {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition duration-300"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
          </a>
        ))}
      </div>
    </div>
  )
}

export default createRoute(async (c) => {
  // kakeiboMenu を取得
  const menuItems = kakeiboMenu();
  return c.render(
    <>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">家計簿アプリ</h1>
          {/* 資産メニュー */}
          <MenuSection title="資産メニュー" items={menuItems['資産メニュー']} />

          {/* 支出メニュー */}
          <MenuSection title="支出メニュー" items={menuItems['支出メニュー']} />

          {/* 収入メニュー */}
          <MenuSection title="収入メニュー" items={menuItems['収入メニュー']} />
        </div>

      </div>
    </>,
    { title: 'top' }
  );
});
