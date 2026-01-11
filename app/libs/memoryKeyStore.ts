import type { KeyStorer } from "firebase-auth-cloudflare-workers";

/**
 * 簡易メモリキャッシュKeyStore
 * 開発環境用のシンプルな実装です。
 * 本番環境ではCloudflare Workers KVを使用してください。
 */
export class MemoryKeyStore implements KeyStorer {
  private cachedValue: string | null = null;

  async get<ExpectedValue = unknown>(): Promise<ExpectedValue | null> {
    if (this.cachedValue === null) {
      return null;
    }
    try {
      return JSON.parse(this.cachedValue) as ExpectedValue;
    } catch {
      return this.cachedValue as ExpectedValue;
    }
  }

  async put(value: string, expirationTtl: number): Promise<void> {
    // 開発環境ではexpirationTtlを無視（メモリキャッシュなので）
    this.cachedValue = value;
  }
}
