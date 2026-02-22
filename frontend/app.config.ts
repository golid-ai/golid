import { defineConfig } from "@solidjs/start/config";

/**
 * SolidStart Configuration
 *
 * SSR is enabled in production for:
 * - Server-side auth redirects (middleware)
 * - Better SEO / initial load
 * - Faster First Contentful Paint
 *
 * In dev, SSR is off for faster HMR.
 */

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  ssr: !isDev,  // SSR off in dev, on in production
  middleware: "./src/middleware.ts",
  server: {
    preset: "node-server",
    compatibilityDate: "2025-01-01",
  },
  vite() {
    // Vite config shared across all vinxi routers (client, SSR, server-function).
    // Note: server.port/host are ignored by vinxi — use PORT/HOST env vars instead.
    return {
      resolve: {
        alias: {
          "~": "/src",
        },
      },
      define: {
        "import.meta.env.VITE_API_URL": JSON.stringify(
          process.env.VITE_API_URL || ""
        ),
      },
      server: {
        proxy: {
          "/api": {
            target: "http://localhost:8080",
            changeOrigin: true,
          },
        },
      },
    };
  },
});
