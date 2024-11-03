import { useState } from "react";
import { FlyoutMenu } from "./FlyoutMenu";
import { assetMenu } from "../settings/kakeiboSettings";

export const Header = () => {
    const navItems = [
        { href: '/auth/logout', name: 'ログアウト' },
    ]

    const [isOpen, setIsOpen] = useState(false);
    // メニューの開閉を制御する関数
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };
    return (
        <header className="p-4 c-wrapper">
            <div className="container mx-auto flex items-center relative">
                <h1 className="text-2xl font-bold">
                    <a href="/auth">
                        SIMPLE KAKEIBO
                    </a>
                </h1>

                {/* md以上の画面幅で表示されるナビゲーションメニュー */}
                <nav className="ml-auto hidden md:flex items-center">
                    <FlyoutMenu items={assetMenu()} title="資産メニュー"></FlyoutMenu>
                    {navItems.map((item, i) => (
                        <a href={item.href} className="ml-8 text-lg font-semibold" key={i}>{item.name}</a>
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
                        <nav className="flex flex-col p-4">
                            <FlyoutMenu items={assetMenu()} title="資産メニュー"></FlyoutMenu>
                            {navItems.map((item, i) => (
                                <a href={item.href} className='mt-2 text-lg font-semibold'>{item.name}</a>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
