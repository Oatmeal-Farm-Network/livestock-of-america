import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const livestockTarget =
    env.VITE_LIVESTOCK_API_URL || "http://127.0.0.1:8000";

  return {
    plugins: [react(), tailwindcss()],
    build: {
      // Lighthouse flags first-party bundles with no source maps. These are
      // emitted as separate .map files that no visitor downloads — only
      // devtools fetch them — so they cost deploy size, not load time.
      sourcemap: true,
      rollupOptions: {
        output: {
          // React and the router change only when a dependency is upgraded,
          // while app code changes every deploy. Splitting them means a
          // routine deploy no longer invalidates the framework bytes, which
          // now carry a one-year immutable cache.
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router"],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/auth": { target: livestockTarget, changeOrigin: true },
        "/api": { target: livestockTarget, changeOrigin: true },
        "/health": { target: livestockTarget, changeOrigin: true },
        "/uploads": { target: livestockTarget, changeOrigin: true },
      },
    },
    preview: {
      port: 8080,
      host: true,
    },
  };
});
