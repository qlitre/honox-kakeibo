/// <reference types="vitest" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import honox from 'honox/vite'
import { defineConfig } from 'vitest/config'

const alias = { '@': path.resolve(__dirname, 'app') }

// schema-tables.sql をD1マイグレーション形式に変換してテストWorkerへ渡す
const schemaQueries = readFileSync(path.resolve(__dirname, 'schema-tables.sql'), 'utf-8')
  .replace(/^--.*$/gm, '')
  .split(';')
  .map((q) => q.trim())
  .filter(Boolean)

export default defineConfig({
  test: {
    projects: [
      {
        // L1: 純粋関数の単体テスト（Node上）
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
          // 本番のWorkersランタイムはUTC固定のため揃える（手元のJSTで結果が変わらないように）
          env: { TZ: 'UTC' },
        },
      },
      {
        // L2: Workersランタイム + 実D1での統合テスト
        resolve: { alias },
        plugins: [
          // HonoXのルート収集（import.meta.glob）とJSX変換を有効にする
          honox({ client: { input: [] } }),
          cloudflareTest({
            wrangler: { configPath: './wrangler.test.jsonc' },
            miniflare: {
              bindings: {
                // wrangler が読み込む .dev.vars の本物の秘匿値をテストに持ち込まない
                SERVICE_ACCOUNT_JSON: '',
                TEST_MIGRATIONS: [{ name: '0001_schema-tables.sql', queries: schemaQueries }],
              },
            },
          }),
        ],
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          setupFiles: ['test/integration/setup.ts'],
        },
      },
    ],
  },
})
