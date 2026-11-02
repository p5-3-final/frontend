import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    env: { VITE_API_BASE_URL: "http://localhost:8080" },
    include: ["src/**/*.test.{ts,tsx}"],
    // Playwright E2E는 vitest가 아니라 pnpm test:e2e로 돌린다.
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
