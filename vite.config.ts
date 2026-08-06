import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const livestockTarget =
    env.VITE_LIVESTOCK_API_URL || "http://127.0.0.1:8001";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/auth": { target: livestockTarget, changeOrigin: true },
        "/api": { target: livestockTarget, changeOrigin: true },
        "/health": { target: livestockTarget, changeOrigin: true },
      },
    },
    preview: {
      port: 8080,
      host: true,
    },
  };
});
