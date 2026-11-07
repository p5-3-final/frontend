import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // SPEC-002 NFR-4: 모바일 너비(360px)도 지원한다.
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
  ],
  // 성능 기준(SPEC-032 NFR-1, SPEC-033 NFR-1 등)은 사용자가 받는 운영 빌드에서 잰다.
  // 개발 서버는 요청마다 모듈을 변환하고 React 개발 빌드가 검사를 더한다. 2코어 CI에서 검색 결과 50개 그리기가
  // 260ms 안팎으로 재어져(기준 200ms) 재시도로만 통과했다.
  // 로컬에서 `pnpm dev`를 띄워 두었으면 그 서버를 그대로 쓴다(reuseExistingServer).
  webServer: {
    command: "pnpm exec vite build && pnpm exec vite preview --port 5173 --strictPort",
    url: "http://localhost:5173",
    // 기본 60초에는 빌드 시간이 들어가지 않아 늘린다.
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    // API는 테스트마다 page.route로 대신하므로 주소만 맞춘다.
    env: { VITE_API_BASE_URL: "http://localhost:8080" },
  },
});
