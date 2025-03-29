import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

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

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={togglePopover}
        className="inline-flex items-center gap-x-1 text-sm font-semibold text-gray-900"
      >
        <span>{title}</span>
        <ChevronDownIcon aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
          style={{
            transform: "translateX(-50%)",
          }}
        >
          <div className="w-56 shrink rounded-xl bg-white p-4 text-sm/6 font-semibold text-gray-900 shadow-lg ring-1 ring-gray-900/5">
            {items.map((item) => (
              <div
                key={item.name}
                className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50"
              >
                <div>
                  <a href={item.href} className="font-semibold text-gray-900">
                    {item.name}
                    <span className="absolute inset-0" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
