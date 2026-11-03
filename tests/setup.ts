import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetUploadsForTest } from "../src/features/upload/model/uploadQueue";
import { resetSessionForTest } from "../src/shared/api/session";
import { server } from "./server";

// jsdom은 <dialog>의 showModal·close를 구현하지 않는다. 열림 상태만 흉내 내고, 포커스 가두기 같은 실제 모달 동작은 E2E로 확인한다.
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: {
    configurable: true,
    value: function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  },
  close: {
    configurable: true,
    value: function close(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  },
});

// 등록하지 않은 요청은 실패시켜, 테스트가 모르는 API 호출을 놓치지 않게 한다.
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  // 세션은 모듈 메모리에 있으므로 테스트마다 처음 상태로 되돌린다.
  resetSessionForTest();
  // 업로드 대기열도 모듈 메모리에 있다.
  resetUploadsForTest();
});

afterAll(() => {
  server.close();
});
