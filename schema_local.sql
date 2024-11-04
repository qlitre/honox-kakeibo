DROP TABLE IF EXISTS asset;
DROP TABLE IF EXISTS asset_category;
DROP TABLE IF EXISTS expense;
DROP TABLE IF EXISTS expense_category;
DROP TABLE IF EXISTS payment_method;

CREATE TABLE IF NOT EXISTS asset_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
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
    method_name TEXT NOT NULL,
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


-- Asset categories
INSERT INTO asset_category (name) VALUES ('現金');
INSERT INTO asset_category (name) VALUES ('日本株式');
INSERT INTO asset_category (name) VALUES ('株式投信');
INSERT INTO asset_category (name) VALUES ('ビットコイン');

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
