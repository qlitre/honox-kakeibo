import { useState } from "react";


export const Header = () => {
    const date = new Date();
    let year = date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric' });
    let month = date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric' });
    // 2024年、11月のようになるので、最後の文字を取り除く
    year = year.slice(0, year.length - 1)
    month = month.slice(0, month.length - 1)
    const navItems = [
        { href: '/auth/asset', name: '資産リスト' },
        { href: '/auth/asset/create', name: '資産登録' },
        { href: `/auth/asset/dashboard/${year}/${month}`, name: '資産ダッシュボード' },
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
                    {navItems.map((item, i) => (
                        <a href={item.href} className="mr-4" key={i}>{item.name}</a>
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
                            {navItems.map((item, i) => (
                                <a href={item.href} className='mt-2'>{item.name}</a>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
