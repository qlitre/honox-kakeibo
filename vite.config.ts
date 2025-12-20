import build from "@hono/vite-build/cloudflare-workers";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import honox from "honox/vite";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
    },
  },
  plugins: [
    honox({
      devServer: { adapter },
      client: { input: ["/app/client.ts", "/app/style.css"] },
    }),
    tailwindcss(),
    build(),
  ],
  ssr: {
    external: ["chart.js"],
  },
});
