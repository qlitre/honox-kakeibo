# HonoX 家計簿アプリ

HonoXで動かすシンプルな家計簿アプリです。Cloudflare Workers + D1で動作します。

## 技術スタック

- **フレームワーク**: HonoX (Hono + React SSR)
- **ランタイム**: Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: Firebase Authentication
- **スタイリング**: Tailwind CSS
- **チャート**: Chart.js

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/qlitre/honox-kakeibo
cd honox-kakeibo
npm install
```

### 2. データベースのセットアップ

D1データベースを作成します：

```bash
npx wrangler d1 create kakeibo
```

`wrangler.jsonc.template`をコピーして`wrangler.jsonc`を作成し、出力されたデータベース情報を編集します：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "kakeibo",
      "database_id": "YOUR_DATABASE_ID" // ← 上のコマンドで出力されたIDに置き換え
    }
  ]
}
```

テーブルとサンプルデータを作成します：

```bash
# テーブル作成
npx wrangler d1 execute kakeibo --local --file=./schema-tables.sql

# サンプルデータ投入（オプション）
npx wrangler d1 execute kakeibo --local --file=./sample-data.sql
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動したら、以下のURLにアクセスできます：
- ログインページ: http://localhost:5173/login
- 家計簿メニュー: http://localhost:5173/auth

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動 (localhost:5173)
npm run build    # 本番ビルド
npm run preview  # 本番ビルドのプレビュー
npm run format   # コードフォーマット
npm run deploy   # Cloudflare Workersにデプロイ
```

## データベース操作

```bash
# ローカルでクエリ実行
npx wrangler d1 execute kakeibo --local --command="SELECT * FROM expense LIMIT 5"

# 本番環境でクエリ実行（--localを外す）
npx wrangler d1 execute kakeibo --command="SELECT * FROM expense LIMIT 5"
```

## 認証設定

### 開発時：認証なしで利用する場合

`app/checkauthFb.ts`の先頭で`return true`を追加すると、Firebase設定なしで動作確認できます：

```typescript
export const checkauthFb = async (c: Context): Promise<boolean> => {
    return true; // ← この行を追加
    // 以下の認証処理はスキップされます
    ...
}
```

これで http://localhost:5173/auth に直接アクセスできます。

![image](https://github.com/user-attachments/assets/747e022e-6279-4dc2-9171-d5c74d323763)

### 本番環境：Firebase認証を設定する

#### 1. Firebaseプロジェクトの作成

[Firebaseコンソール](https://firebase.google.com/?hl=ja)にアクセスしてプロジェクトを作成します。

![image](https://github.com/user-attachments/assets/9ff1a805-2f1f-4636-b3c1-d2e6951dfbbe)

#### 2. Webアプリの追加

プロジェクトのトップページからWebアプリを追加します。

![image](https://github.com/user-attachments/assets/d2cab38a-9197-49a5-90b7-ece37b0eebec)

アプリ名を入力します：

![image](https://github.com/user-attachments/assets/1ad02b66-ac0f-48a5-a0cf-16f2e5af223e)

#### 3. Firebase設定を取得

発行されたAPIキーなどの設定値をコピーします：

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "kakeibo-test-d41d3.firebaseapp.com",
  projectId: "kakeibo-test-d41d3",
  storageBucket: "kakeibo-test-d41d3.firebasestorage.app",
  messagingSenderId: "798687987590",
  appId: "1:798687987590:web:xxxxxxxxxxxxx"
};
```

この値を`wrangler.jsonc`の`vars`セクションに対応する形で設定します：

```jsonc
{
  "vars": {
    "FB_API_KEY": "your-api-key",
    "FB_AUTH_DOMAIN": "kakeibo-test-d41d3.firebaseapp.com",
    "FB_PROJECT_ID": "kakeibo-test-d41d3",
    "FB_STORAGE_BUCKET": "kakeibo-test-d41d3.firebasestorage.app",
    "FB_MESSAGE_SENDER_ID": "798687987590",
    "FB_APP_ID": "1:798687987590:web:xxxxxxxxxxxxx"
  }
}
```

#### 4. 認証方法の設定

Firebaseコンソールで **Authentication** をクリックします。

![image](https://github.com/user-attachments/assets/a062054f-49d9-4343-8ff0-d64a13c837dc)

「始める」をクリックし、ログイン方法で「メール / パスワード」を選択します。

![image](https://github.com/user-attachments/assets/76730f57-1d07-4264-918b-1d2bfceb9efc)

以下のように設定して有効化します：

![image](https://github.com/user-attachments/assets/28b86c0f-ffeb-4fc2-8750-0cc42a5649b0)

#### 5. ユーザーの追加

「ユーザー」タブに移動し、ユーザーを追加します。

![image](https://github.com/user-attachments/assets/09cfeff0-48bc-44fd-b375-2957fa29f18a)

#### 6. 動作確認

```bash
npm run dev
```

http://localhost:5173/login にアクセスし、登録したメールアドレスとパスワードでログインできればOKです。

> **注意**: 開発時に`app/checkauthFb.ts`を編集した場合は元に戻してください。

## プロジェクト構成

```
app/
├── routes/          # ファイルベースルーティング
│   ├── auth/       # 認証が必要なページ
│   └── api/        # APIエンドポイント
├── islands/        # クライアントサイドコンポーネント
├── components/     # サーバーサイドコンポーネント
├── libs/           # データベース操作（dbService.ts）
├── utils/          # ユーティリティ関数
└── checkauthFb.ts  # Firebase認証ロジック
```

## デプロイ

```bash
npm run deploy
```

Cloudflare Workersにデプロイされます。本番環境のD1データベースには`--local`フラグなしでスキーマを適用してください。
