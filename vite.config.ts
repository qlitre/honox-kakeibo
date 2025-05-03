// vite.config.ts
import build from "@hono/vite-build/cloudflare-workers";
import honox from "honox/vite";
import { defineConfig } from "vite";
import path from "path";
import { getPlatformProxy } from "wrangler";
export default defineConfig(async ({ mode }) => {
  if (mode === "client") {
    return {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "app"),
        },
      },
      build: {
        rollupOptions: {
          input: ["./app/client.ts", "./app/style.css"],
          output: {
            entryFileNames: "static/client.js",
            chunkFileNames: "static/assets/[name]-[hash].js",
            assetFileNames: "static/assets/[name].[ext]",
          },
        },
        emptyOutDir: false,
      },
    };
  } else {
    const { env, dispose } = await getPlatformProxy();
    return {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "app"),
        },
      },
      ssr: {
        external: ["react", "react-dom", "react-chartjs-2", "chart.js"],
        noExternal: [],
      },
      plugins: [
        honox({ devServer: { env } }),
        build(),
        {
          name: "dispose-wrangler-proxy",
          closeBundle: async () => {
            await dispose(); // プロキシの後始末
          },
        },
      ],
    };
  }
});
