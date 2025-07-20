#!/bin/bash

# DB完全リセットスクリプト
echo "=== データベース完全リセット ==="

# データベース名
DB_NAME="kakeibo"

echo "警告: 全てのデータが削除されます。"
read -p "続行しますか？ (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "1. 全テーブル削除..."
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS expense_check_template;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS fund_transaction;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS income;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS income_category;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS expense;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS payment_method;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS expense_category;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS asset;"
    npx wrangler d1 execute $DB_NAME --local --command="DROP TABLE IF EXISTS asset_category;"

    echo "2. テーブル再作成..."
    npx wrangler d1 execute $DB_NAME --local --file=./schema-tables.sql

    echo "3. サンプルデータ挿入..."
    npx wrangler d1 execute $DB_NAME --local --file=./sample-data.sql

    echo "=== リセット完了 ==="
else
    echo "キャンセルしました。"
fi