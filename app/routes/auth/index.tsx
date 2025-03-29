import { createRoute } from "honox/factory";
import { kakeiboMenu } from "@/settings/kakeiboSettings";

type MenuItem = {
  name: string;
  href: string;
};

type Props = {
  title: string;
  items: MenuItem[];
};

const MenuSection = ({ title, items }: Props) => {
  return (
    <div className="mb-10">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition duration-300"
          >
            <h3 className="font-semibold text-gray-800 mb-2">{item.name}</h3>
          </a>
        ))}
      </div>
    </div>
  );
};

export default createRoute(async (c) => {
  // kakeiboMenu を取得
  const menuItems = kakeiboMenu();

  // メニューセクションを動的に生成
  const menuSections = Object.entries(menuItems).map(([title, items]) => (
    <MenuSection key={title} title={title} items={items} />
  ));

  return c.render(
    <>
      <div className="min-h-screen bg-gray-100 py-10">
        <div className="container mx-auto px-4">{menuSections}</div>
      </div>
    </>,
    { title: "top" },
  );
});
