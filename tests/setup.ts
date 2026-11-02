import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetSessionForTest } from "../src/shared/api/session";
import { server } from "./server";

// 등록하지 않은 요청은 실패시켜, 테스트가 모르는 API 호출을 놓치지 않게 한다.
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  // 세션은 모듈 메모리에 있으므로 테스트마다 처음 상태로 되돌린다.
  resetSessionForTest();
});

afterAll(() => {
  server.close();
});
