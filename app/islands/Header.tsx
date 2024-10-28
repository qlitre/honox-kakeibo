import { useState } from "react";


export const Header = () => {
    const [isOpen, setIsOpen] = useState(false);

    // メニューの開閉を制御する関数
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <header className="p-4 c-wrapper">
            <div className="container mx-auto flex items-center relative">
                <h1 className="text-2xl font-bold">
                    SIMPLE KAKEIBO
                </h1>

                {/* md以上の画面幅で表示されるナビゲーションメニュー */}
                <nav className="ml-auto hidden md:flex items-center">
                    <a href="" className="mr-4">資産記録</a>
                    <a href="" className="mr-4">資産ダッシュボード</a>
                    <a href="/auth/logout" className="mr-4">ログアウト</a>
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
                        <nav className="flex flex-col">
                            <a href="" className="px-4 py-2">資産記録</a>
                            <a href="" className="px-4 py-2">資産ダッシュボード</a>
                            <a href="/auth/logout" className="px-4 py-2">ログアウト</a>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
