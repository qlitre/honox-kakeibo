// vite.config.ts
import build from "@hono/vite-build/cloudflare-workers";
import honox from "honox/vite";
import { defineConfig } from "vite";
import path from "path";

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
        honox(),
        build(),
      ],
    };
  }
});
