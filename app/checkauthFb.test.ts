import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkauthFb } from "./checkauthFb";
import type { Context } from "hono";

// Honoの Context をモック
const createMockContext = (
  cookieValue?: string,
  envValue?: string,
): Partial<Context> => ({
  env: {
    FB_API_KEY: envValue || "test-api-key",
  } as any,
  req: {} as any,
  res: {} as any,
});

// グローバルfetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// getCookieモック
vi.mock("hono/cookie", () => ({
  getCookie: vi.fn(),
}));

import { getCookie } from "hono/cookie";
const mockGetCookie = vi.mocked(getCookie);

describe("checkauthFb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("トークンが存在しない場合", () => {
    it("クッキーにトークンがない場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue(undefined);
      const context = createMockContext();

      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
      expect(mockGetCookie).toHaveBeenCalledWith(context, "firebase_token");
    });

    it("クッキーが空文字の場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("");
      const context = createMockContext();

      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });
  });

  describe("Firebase API呼び出し", () => {
    it("正しいエンドポイントとパラメータでAPIを呼び出す", async () => {
      const testToken = "test-id-token";
      const testApiKey = "test-api-key";

      mockGetCookie.mockReturnValue(testToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            users: [
              {
                localId: "user123",
                email: "test@example.com",
                emailVerified: true,
              },
            ],
          }),
      });

      const context = createMockContext(testToken, testApiKey);

      await checkauthFb(context as Context);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${testApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: testToken }),
        },
      );
    });
  });

  describe("認証成功のケース", () => {
    it("有効なトークンとユーザー情報がある場合はtrueを返す", async () => {
      mockGetCookie.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            users: [
              {
                localId: "user123",
                email: "test@example.com",
                emailVerified: true,
                displayName: "Test User",
              },
            ],
          }),
      });

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(true);
    });
  });

  describe("認証失敗のケース", () => {
    it("Firebase APIからエラーレスポンスが返された場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("invalid-token");
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve("Invalid token"),
      });

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });

    it("ユーザー情報が存在しない場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("token-without-user");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            users: [],
          }),
      });

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });

    it("usersプロパティが存在しない場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("malformed-response-token");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("ネットワークエラーが発生した場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("network-error-token");
      mockFetch.mockRejectedValue(new Error("Network error"));

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });

    it("JSONパースエラーが発生した場合はfalseを返す", async () => {
      mockGetCookie.mockReturnValue("json-parse-error-token");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      const context = createMockContext();
      const result = await checkauthFb(context as Context);

      expect(result).toBe(false);
    });
  });

  describe("環境変数", () => {
    it("FB_API_KEYが設定されていない場合も動作する", async () => {
      mockGetCookie.mockReturnValue("test-token");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            users: [
              {
                localId: "user123",
                email: "test@example.com",
                emailVerified: true,
              },
            ],
          }),
      });

      // envをundefinedに設定したコンテキストを作成
      const context = {
        env: {} as any,
        req: {} as any,
        res: {} as any,
      };

      await checkauthFb(context as Context);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=undefined",
        expect.any(Object),
      );
    });
  });
});
