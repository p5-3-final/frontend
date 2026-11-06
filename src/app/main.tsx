import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Root element #root not found");
}

/**
 * 개발용 mock 모드(SPEC-031 plan, D-25). VITE_API_MOCKING=true일 때만 MSW 브라우저 워커를 켠다.
 * 값은 빌드 때 문자열로 바뀌어, 꺼진 빌드에서는 아래 동적 import가 실행되지 않는다(운영 빌드에서는 켜지 않는다).
 */
async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_API_MOCKING !== "true") {
    return;
  }
  const { worker } = await import("../../mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass" });
}

void enableMocking().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
