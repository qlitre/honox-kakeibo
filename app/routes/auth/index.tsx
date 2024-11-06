import { createRoute } from 'honox/factory';
import { kakeiboMenu } from '@/settings/kakeiboSettings';

export default createRoute(async (c) => {
  // kakeiboMenu を取得
  const menuItems = kakeiboMenu();

  return c.render(
    <>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">家計簿アプリ</h1>

          {/* 資産メニュー */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">資産メニュー</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems['資産メニュー'].map((item) => (
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

          {/* 支出メニュー */}
          <div>
            <h2 className="text-xl font-semibold mb-4">支出メニュー</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems['支出メニュー'].map((item) => (
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

          {/* 収入メニュー */}
          <div>
            <h2 className="text-xl font-semibold mb-4">収入メニュー</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {menuItems['収入メニュー'].map((item) => (
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

        </div>

      </div>
    </>,
    { title: 'top' }
  );
});
