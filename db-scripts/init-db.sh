#!/bin/bash

# ローカルDB初期化スクリプト
echo "=== ローカルDB初期化 ==="

# データベース名
DB_NAME="kakeibo"

echo "1. テーブル作成..."
npx wrangler d1 execute $DB_NAME --local --file=./schema-tables.sql

echo "2. サンプルデータ挿入..."
npx wrangler d1 execute $DB_NAME --local --file=./sample-data.sql

echo "=== 完了 ==="