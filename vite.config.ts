// vite.config.ts
import build from '@hono/vite-build/cloudflare-pages'
import honox from 'honox/vite'
import { defineConfig } from 'vite'
import { getPlatformProxy } from 'wrangler'

export default defineConfig(async ({ mode }) => {
  if (mode === 'client') {
    return {
      build: {
        rollupOptions: {
          input: ['./app/client.ts', '/app/style.css'],
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
      ssr: {
        external: ['react', 'react-dom', 'react-chartjs-2', 'chart.js', '@supabase/supabase-js'],
        noExternal: [],
      },
      plugins: [
        honox({ devServer: { env } }), build()
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