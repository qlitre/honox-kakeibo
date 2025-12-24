import type { FC } from "hono/jsx";
import { useState, useEffect, useRef } from "hono/jsx";

type Item = {
  name: string;
  href: string;
};

type Props = {
  items: Item[];
  title: string;
};

export const FlyoutMenu: FC<Props> = ({ items, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  // 外部クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flyout-menu-container" ref={menuRef}>
      <button
        type="button"
        className="flyout-menu-button inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer"
        onClick={togglePopover}
      >
        <span>{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="flyout-menu-panel absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4"
          style={{ transform: "translateX(-50%)" }}
        >
          <div className="w-56 shrink rounded-xl bg-white p-4 text-sm/6 font-semibold text-gray-900 shadow-lg ring-1 ring-gray-900/5 border border-gray-100">
            {items.map((item) => (
              <div
                key={item.name}
                className="group relative flex gap-x-6 rounded-lg p-2 hover:bg-gray-50"
              >
                <a
                  href={item.href}
                  className="block w-full font-semibold text-gray-900"
                >
                  {item.name}
                  <span className="absolute inset-0" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
