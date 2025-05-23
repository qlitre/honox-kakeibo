CREATE TABLE IF NOT EXISTS asset_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_investment BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    asset_category_id INTEGER NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (asset_category_id) REFERENCES asset_category(id) ON DELETE RESTRICT
);


CREATE TABLE IF NOT EXISTS expense_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_method (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    expense_category_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (expense_category_id) REFERENCES expense_category(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS income_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    income_category_id INTEGER NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (income_category_id) REFERENCES income_category(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fund_transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,               
    amount INTEGER NOT NULL,          
    description TEXT,                 
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);


-- Asset categories
INSERT INTO asset_category (name,is_investment) VALUES ('現金',0);
INSERT INTO asset_category (name,is_investment) VALUES ('日本株式',1);
INSERT INTO asset_category (name,is_investment) VALUES ('株式投信',1);
INSERT INTO asset_category (name,is_investment) VALUES ('ビットコイン',0);

-- Asset data from 2024-01 to 2024-11
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-01-01', 45000, 1, '1月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-01-01', 135000, 2, '1月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-01-01', 180000, 3, '1月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-01-01', 68000, 4, '1月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-02-01', 46000, 1, '2月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-02-01', 137000, 2, '2月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-02-01', 182000, 3, '2月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-02-01', 69000, 4, '2月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-03-01', 47000, 1, '3月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-03-01', 138000, 2, '3月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-03-01', 184000, 3, '3月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-03-01', 70000, 4, '3月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-04-01', 48000, 1, '4月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-04-01', 140000, 2, '4月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-04-01', 185000, 3, '4月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-04-01', 71000, 4, '4月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-05-01', 49000, 1, '5月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-05-01', 141000, 2, '5月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-05-01', 187000, 3, '5月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-05-01', 72000, 4, '5月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-06-01', 50000, 1, '6月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-06-01', 142000, 2, '6月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-06-01', 188000, 3, '6月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-06-01', 73000, 4, '6月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-07-01', 46000, 1, '7月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-07-01', 143000, 2, '7月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-07-01', 190000, 3, '7月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-07-01', 70000, 4, '7月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 46000, 1, '8月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 140000, 2, '8月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 185000, 3, '8月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 70000, 4, '8月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 48000, 1, '9月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 145000, 2, '9月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 190000, 3, '9月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 72000, 4, '9月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 50000, 1, '10月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 150000, 2, '10月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 200000, 3, '10月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 75000, 4, '10月のビットコイン残高');

INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 48000, 1, '11月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 145000, 2, '11月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 190000, 3, '11月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 72000, 4, '11月のビットコイン残高');

INSERT INTO fund_transaction (date, amount) VALUES ('2023-12-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-01-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-02-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-03-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-04-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-05-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-06-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-07-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-08-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-09-25', 20000);
INSERT INTO fund_transaction (date, amount) VALUES ('2024-10-25', 20000);

-- Expense categories
INSERT INTO expense_category (name) VALUES ('食費');
INSERT INTO expense_category (name) VALUES ('交通費');
INSERT INTO expense_category (name) VALUES ('家賃');
INSERT INTO expense_category (name) VALUES ('娯楽');

-- Payment methods
INSERT INTO payment_method (name) VALUES ('現金');
INSERT INTO payment_method (name) VALUES ('クレジットカード');
INSERT INTO payment_method (name) VALUES ('デビットカード');
INSERT INTO payment_method (name) VALUES ('電子マネー');

-- Expense data from 2024-01 to 2024-11
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-01-05', 1500, 1, 1, 'ランチ代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-01-10', 5000, 2, 2, '電車定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-01-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-01-20', 3000, 4, 4, '映画鑑賞');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-02-05', 1600, 1, 1, 'ランチ代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-02-10', 5200, 2, 2, '電車定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-02-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-02-20', 3500, 4, 4, 'カフェでの飲み物');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-03-05', 1700, 1, 1, '昼食費');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-03-10', 5300, 2, 2, 'バス定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-03-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-03-20', 4000, 4, 4, 'コンサートチケット');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-04-05', 1800, 1, 1, 'ディナー代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-04-10', 5400, 2, 2, '電車定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-04-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-04-20', 3200, 4, 4, '映画チケット');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-05-05', 1500, 1, 1, 'カフェでの軽食');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-05-10', 5500, 2, 2, 'タクシー代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-05-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-05-20', 2800, 4, 4, 'ミュージカル観劇');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-06-05', 1600, 1, 1, 'ランチ代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-06-10', 5700, 2, 2, '電車定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-06-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-06-20', 3500, 4, 4, 'カフェでの読書');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-07-05', 1700, 1, 1, '朝食代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-07-10', 5800, 2, 2, 'バス定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-07-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-07-20', 3000, 4, 4, 'プール利用料');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-08-05', 1800, 1, 1, '夕食費');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-08-10', 5900, 2, 2, 'タクシー代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-08-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-08-20', 3300, 4, 4, '映画チケット');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-09-05', 1500, 1, 1, '軽食代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-09-10', 6000, 2, 2, '電車定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-09-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-09-20', 2800, 4, 4, '美術館の入場料');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-10-05', 1600, 1, 1, '朝食代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-10-10', 6100, 2, 2, 'バス定期代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-10-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-10-20', 2500, 4, 4, 'スポーツ観戦チケット');

INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-11-05', 1750, 1, 1, '昼食代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-11-10', 6200, 2, 2, 'タクシー代');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-11-15', 80000, 3, 3, '家賃支払い');
INSERT INTO expense (date, amount, expense_category_id, payment_method_id, description) VALUES ('2024-11-20', 2900, 4, 4, '演劇チケット');


INSERT INTO income_category (name) VALUES ('給与');
INSERT INTO income_category (name) VALUES ('副業');
INSERT INTO income_category (name) VALUES ('投資収益');
INSERT INTO income_category (name) VALUES ('ギフト');

INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-01-15', 300000, 1, '1月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-01-20', 50000, 2, '1月の副業収入');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-02-15', 300000, 1, '2月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-02-25', 70000, 3, '2月の投資収益');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-03-15', 300000, 1, '3月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-03-18', 10000, 4, '3月のギフト収入');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-04-15', 300000, 1, '4月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-04-20', 60000, 2, '4月の副業収入');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-05-15', 300000, 1, '5月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-05-25', 80000, 3, '5月の投資収益');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-06-15', 300000, 1, '6月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-07-15', 300000, 1, '7月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-07-20', 75000, 2, '7月の副業収入');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-08-15', 300000, 1, '8月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-08-25', 65000, 3, '8月の投資収益');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-09-15', 300000, 1, '9月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-10-15', 300000, 1, '10月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-10-20', 85000, 2, '10月の副業収入');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-11-15', 300000, 1, '11月の給与');
INSERT INTO income (date, amount, income_category_id, description) VALUES ('2024-11-25', 90000, 3, '11月の投資収益');
