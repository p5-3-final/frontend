import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // 개발용 mock 모드(SPEC-031)에서만 MSW 워커를 정적 파일로 내보낸다. 그 밖의 빌드에는 워커 파일이 들어가지 않는다.
  publicDir:
    loadEnv(mode, process.cwd(), "VITE_").VITE_API_MOCKING === "true" ? "mocks/public" : "public",
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
}));
