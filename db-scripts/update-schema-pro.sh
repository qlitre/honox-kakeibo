#!/bin/bash

# スキーマ更新スクリプト（既存データ保持）
echo "=== スキーマ更新 ==="

# データベース名
DB_NAME="kakeibo"

echo "1. テーブル更新..."
npx wrangler d1 execute $DB_NAME --local --file=./schema-tables.sql

echo "=== 完了 ==="