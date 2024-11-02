DROP TABLE IF EXISTS asset;
DROP TABLE IF EXISTS asset_category;



CREATE TABLE IF NOT EXISTS asset_category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    asset_category_id INTEGER NOT NULL,
    description TEXT,
    FOREIGN KEY (asset_category_id) REFERENCES asset_category(id) ON DELETE RESTRICT
);

INSERT INTO asset_category (name) VALUES ('現金');
INSERT INTO asset_category (name) VALUES ('日本株式');
INSERT INTO asset_category (name) VALUES ('株式投信');
INSERT INTO asset_category (name) VALUES ('ビットコイン');

-- 2024/11/01
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 48000, 1, '11月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 145000, 2, '11月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 190000, 3, '11月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-11-01', 72000, 4, '11月のビットコイン残高');


-- 2024/10/01
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 50000, 1, '10月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 150000, 2, '10月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 200000, 3, '10月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-10-01', 75000, 4, '10月のビットコイン残高');

-- 2024/09/01
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 48000, 1, '9月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 145000, 2, '9月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 190000, 3, '9月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-09-01', 72000, 4, '9月のビットコイン残高');

-- 2024/08/01
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 46000, 1, '8月の現金残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 140000, 2, '8月の日本株式残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 185000, 3, '8月の株式投信残高');
INSERT INTO asset (date, amount, asset_category_id, description) VALUES ('2024-08-01', 70000, 4, '8月のビットコイン残高');
