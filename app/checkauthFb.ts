import { Context } from "hono";
import { getCookie } from "hono/cookie";

export const checkauthFb = async (c: Context): Promise<boolean> => {
  try {
    // クッキーから `firebase_token` を取得
    const idToken = getCookie(c, "firebase_token");
    if (!idToken) {
      console.log("No token found");
      return false;
    }

    // Firebase Authentication REST API エンドポイント
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${c.env.FB_API_KEY}`;

    // トークンの検証リクエストを送信
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    // レスポンスが正常でない場合はエラー
    if (!response.ok) {
      console.error("Invalid token response:", await response.text());
      return false;
    }
    interface FirebaseResponse {
      users: Array<{
        localId: string;
        email: string;
        emailVerified: boolean;
        displayName?: string;
      }>;
    }
    // ユーザー情報を取得
    const data: FirebaseResponse = await response.json();
    const user = data.users?.[0];
    if (!user) {
      console.log("No user data found");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Token verification failed:", error);
  }

  // トークンが無効な場合
  return false;
};
