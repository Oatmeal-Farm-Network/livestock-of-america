import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** OFN main backend hosts plant + ingredient knowledgebase APIs. */
const DEFAULT_OFN_API =
  "https://oatmealfarmnewtorkbackend-802455386518.us-central1.run.app";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const livestockTarget = env.VITE_LIVESTOCK_API_URL || "http://127.0.0.1:8000";
  const ofnTarget = env.VITE_OFN_API_URL || DEFAULT_OFN_API;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Plant / ingredient KB live on OFN main backend (not livestock service)
        "/api/plant-knowledgebase": {
          target: ofnTarget,
          changeOrigin: true,
          secure: true,
        },
        "/api/ingredient-knowledgebase": {
          target: ofnTarget,
          changeOrigin: true,
          secure: true,
        },
        // Auth + account/business APIs live on OFN main (same as OFN Dashboard)
        "/auth": { target: ofnTarget, changeOrigin: true, secure: true },
        "/api/company": { target: ofnTarget, changeOrigin: true, secure: true },
        "/api/businesses": { target: ofnTarget, changeOrigin: true, secure: true },
        "/api": { target: livestockTarget, changeOrigin: true },
        "/health": { target: livestockTarget, changeOrigin: true },
        "/yf": {
          target: "https://query1.finance.yahoo.com",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/yf/, ""),
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LOA/1.0)",
            Accept: "application/json",
          },
        },
      },
    },
    preview: {
      port: 8080,
      host: true,
    },
  };
});
