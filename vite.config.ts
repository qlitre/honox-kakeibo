import build from '@hono/vite-build/cloudflare-workers'
import adapter from '@hono/vite-dev-server/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import honox from 'honox/vite'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
      // `cloudflare:workers` はWorkersランタイム専用モジュールのため、
      // Node上で動くdevサーバーではスタブに差し替える（ビルド時はexternal扱い）
      ...(command === 'serve'
        ? {
            'cloudflare:workers': path.resolve(__dirname, 'app/devShims/cloudflare-workers.ts'),
          }
        : {}),
    },
  },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ['/app/client.ts', '/app/style.css'] },
    }),
    tailwindcss(),
    build(),
  ],
  ssr: {
    external: ['chart.js', 'ajv', 'ajv-formats'],
  },
  build: {
    rollupOptions: {
      external: ['cloudflare:workers'],
    },
  },
}))
