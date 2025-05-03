HonoXで動かすシンプルな家計簿です。

## setup方法

適当なディレクトリでgit cloneしてください。

```
git clone https://github.com/qlitre/honox-kakeibo
```

ディレクトリに移動してnpm installします。

```
cd honox-kakeibo
npm install
```

家計簿データベースを作成します。
```
npx wrangler d1 create kakeibo
```

wrangler.jsonc.templateのファイル名をwrangler.tomlに変更し、出力されたデータベース情報を編集します。

```
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "kakeibo",
      "database_id": "8ad8c765-ea17-492f-b511-7cb76af6e96e",
    },
  ],
```

以下のコマンドを実行してテーブルとテストデータを作成します。
```
npx wrangler d1 execute kakeibo  --local --file=./schema.sql
```

続いてdev.vars.templateのファイル名をdev.varsに変更します。

### 認証なしで利用する場合
この家計簿アプリはFirebaseでユーザー認証をかけることができますが、以下のようにするとFirebaseの設定なしでもデータが確認できます。
`app/checkauthFb.ts`の判定関数を以下のように編集し、必ずtrueが返るようにします。

```
export const checkauthFb = async (c: Context): Promise<boolean> => {
　// 1行目でtrueを返すように追記
    return true
    try {
　　　// 省略
    } catch (error) {
        console.error('Token verification failed:', error);
    }

    // トークンが無効な場合
    return false;
};
```

編集したら`npm run dev`して、`http://localhost:5173/auth`に直接アクセスします。
以下のように家計簿メニューが表示されたら正常に動いています。

![image](https://github.com/user-attachments/assets/747e022e-6279-4dc2-9171-d5c74d323763)

### Firebase認証をかける
認証をかける場合は以下のURLからFirebaseコンソールにアクセスして適当なプロジェクトを作ります。

https://firebase.google.com/?hl=ja

![image](https://github.com/user-attachments/assets/9ff1a805-2f1f-4636-b3c1-d2e6951dfbbe)

プロジェクトが作成出来たらトップページからWEBアプリを追加します。

![image](https://github.com/user-attachments/assets/d2cab38a-9197-49a5-90b7-ece37b0eebec)

似たような名前を適当に入力します。
![image](https://github.com/user-attachments/assets/1ad02b66-ac0f-48a5-a0cf-16f2e5af223e)

そうしますと、以下のようにapikeyなどが発行されます。

```
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "kakeibo-test-d41d3.firebaseapp.com",
  projectId: "kakeibo-test-d41d3",
  storageBucket: "kakeibo-test-d41d3.firebasestorage.app",
  messagingSenderId: "798687987590",
  appId: "1:798687987590:web:1ffabe40bdasdsakauua"
};
```

こちらの値を`wrangler.jsonc`に対応するようにコピペします。

続いてコンソールに戻りユーザーを作成します。

Authenticationをクリックします。

![image](https://github.com/user-attachments/assets/a062054f-49d9-4343-8ff0-d64a13c837dc)

始めるをクリックして、ログイン方法を選択します。
メール / パスワードにします。

![image](https://github.com/user-attachments/assets/76730f57-1d07-4264-918b-1d2bfceb9efc)

以下のように設定して進みます。

![image](https://github.com/user-attachments/assets/28b86c0f-ffeb-4fc2-8750-0cc42a5649b0)

ユーザータブに移動し、ユーザーを追加します。
自身のEmailアドレスと適当なパスワードを入れて追加します。

![image](https://github.com/user-attachments/assets/09cfeff0-48bc-44fd-b375-2957fa29f18a)

追加できたら `npm run dev`して`http://localhost:5173/login`にアクセスします。

先ほど登録したemailアドレスとパスワードでログインができたらオッケーです。
※上の認証なしパターンで`app/checkauthFb.ts`を編集された方は元に戻すのに注意
