import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetNotificationsForTest } from "../src/features/notifications/model/notificationStream";
import { resetUploadsForTest } from "../src/features/upload/model/uploadQueue";
import { resetSessionForTest } from "../src/shared/api/session";
import { installResizeObserver } from "./resizeObserver";
import { server } from "./server";

// 화면은 lazy 라우트와 MSW 스트림을 거쳐 그려진다. 전체 테스트를 병렬로 돌릴 때 기본 1초로는 모자라 3초로 둔다.
configure({ asyncUtilTimeout: 3000 });

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

// jsdom은 미디어를 읽지 않아 play·pause가 "Not implemented" 오류를 낸다. 호출만 받아 두고, 실제 재생은 E2E와 시연으로 확인한다.
Object.defineProperties(HTMLMediaElement.prototype, {
  play: { configurable: true, value: () => Promise.resolve() },
  pause: { configurable: true, value: () => undefined },
});

installResizeObserver();

// jsdom은 포인터 캡처를 구현하지 않는다(구역 꼭짓점 끌기, SPEC-032 R-11). 호출만 받아 둔다.
Object.defineProperties(Element.prototype, {
  setPointerCapture: { configurable: true, value: () => undefined },
  releasePointerCapture: { configurable: true, value: () => undefined },
  hasPointerCapture: { configurable: true, value: () => false },
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
  // 업로드 대기열과 알림 연결도 모듈 메모리에 있다.
  resetUploadsForTest();
  resetNotificationsForTest();
});

afterAll(() => {
  server.close();
});
