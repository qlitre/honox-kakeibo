import { createRoute } from 'honox/factory';
import { assetMenu } from '@/settings/kakeiboSettings';

export default createRoute(async (c) => {
  const assetItems = assetMenu()
  return c.render(
    <>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-center">家計簿アプリ</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assetItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h2>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>,
    { title: 'top' }
  );
});
