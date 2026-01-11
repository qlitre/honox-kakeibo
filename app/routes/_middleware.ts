import { createRoute } from "honox/factory";
import { createMiddleware } from "hono/factory";
import { bearerAuth } from "hono/bearer-auth";
import {
  verifySessionCookieFirebaseAuth,
  type VerifySessionCookieFirebaseAuthConfig,
} from "@hono/firebase-auth";
import { WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
import { MemoryKeyStore } from "@/libs/memoryKeyStore";

// Firebase認証設定
const firebaseAuthConfig: VerifySessionCookieFirebaseAuthConfig = {
  projectId: "kakeiboproject-141e4",
  cookieName: "session",
  redirects: {
    signIn: "/login",
  },
  keyStoreInitializer: (c) => {
    // 本番環境ではKVを使用、開発環境ではメモリキャッシュを使用
    if (c.env.PUBLIC_JWK_CACHE_KV) {
      return WorkersKVStoreSingle.getOrInitialize(
        c.env.PUBLIC_JWK_CACHE_KEY,
        c.env.PUBLIC_JWK_CACHE_KV,
      );
    } else {
      // 開発環境用のメモリキャッシュ
      return new MemoryKeyStore();
    }
  },
};

const authMiddleware = createMiddleware(async (c, next) => {
  if (c.req.path.startsWith("/auth")) {
    // @hono/firebase-authのミドルウェアを使用
    const verifyAuth = verifySessionCookieFirebaseAuth(firebaseAuthConfig);
    return verifyAuth(c, next);
  } else if (c.req.path.startsWith("/api")) {
    // API認証は既存のbearer authを維持
    const token = c.env.HONO_IS_COOL;
    const auth = bearerAuth({ token });
    return auth(c, next);
  } else {
    await next();
  }
});

export default createRoute(authMiddleware);
