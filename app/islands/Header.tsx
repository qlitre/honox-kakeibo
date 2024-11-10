import { useState } from "react";
import { FlyoutMenu } from "@/islands/FlyoutMenu";
import { kakeiboMenu } from "@/settings/kakeiboSettings";
import type { FC } from 'react';

export const Header: FC = () => {
    const navItems = [
        { href: '/auth/logout', name: 'ログアウト' },
        { href: '/auth/logout_fb', name: 'ログアウト(FB)' },
    ];

    const [isOpen, setIsOpen] = useState(false);

    // メニューの開閉を制御する関数
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // kakeiboMenu を取得
    const menuItems = kakeiboMenu();

    // メニューセクションを動的に生成
    const menuSections = Object.entries(menuItems).map(([title, items]) => (
        <FlyoutMenu key={title} title={title} items={items} />
    ));


    return (
        <header className="p-4 c-wrapper">
            <div className="container mx-auto flex items-center relative">
                <h1 className="text-2xl font-bold">
                    <a href="/auth">
                        SIMPLE KAKEIBO
                    </a>
                </h1>

                {/* md以上の画面幅で表示されるナビゲーションメニュー */}
                <nav className="ml-auto hidden md:flex items-center space-x-8">
                    {menuSections}
                    {navItems.map((item, i) => (
                        <a href={item.href} className="text-lg font-semibold" key={i}>
                            {item.name}
                        </a>
                    ))}
                </nav>
                {/* md以下の画面幅で表示されるメニューアイコン */}
                <button
                    onClick={toggleMenu}
                    className="ml-auto md:hidden focus:outline-none"
                >
                    <img src="/static/icon_menu.svg" alt="メニューアイコン" />
                </button>

                {/* ドロップダウンメニュー */}
                {isOpen && (
                    <div className="absolute top-16 right-0 bg-white shadow-md md:hidden">
                        <nav className="flex flex-col p-4 space-y-2">
                            {menuSections}
                            {navItems.map((item, i) => (
                                <a href={item.href} className="text-lg font-semibold" key={i}>
                                    {item.name}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
