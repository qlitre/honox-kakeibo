// vite.config.ts
import build from '@hono/vite-build/cloudflare-pages'
import honox from 'honox/vite'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'
import path from 'path';

export default defineConfig(async ({ mode }) => {
  if (mode === 'client') {
    return {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'app'), // src ディレクトリを '@' で参照できるように設定
        },
      },
      build: {
        rollupOptions: {
          input: ['./app/client.ts', './app/style.css'],
          output: {
            entryFileNames: 'static/client.js',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            assetFileNames: 'static/assets/[name].[ext]',
          },
        },
        emptyOutDir: false,
      },
    }
  } else {
    const { env, dispose } = await getPlatformProxy();
    return {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'app'), // src ディレクトリを '@' で参照できるように設定
        },
      },
      ssr: {
        external: ['react', 'react-dom', 'react-chartjs-2', 'chart.js',],
        noExternal: [],
      },
      plugins: [
        honox({ devServer: { env } }),
        build(),
      ],
      server: {
        watch: {
          ignored: ['**/C:/DumpStack.log.tmp', '**/C:\\DumpStack.log.tmp'],
          usePolling: true, // ポーリングベースの監視に切り替え
          interval: 1000    // ポーリングの間隔を調整
        }
      },
    }
  }
})