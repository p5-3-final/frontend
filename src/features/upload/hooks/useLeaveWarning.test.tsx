import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mediaHandlers } from "../../../../mocks/handlers";
import { server } from "../../../../tests/server";
import { addFiles } from "../model/uploadQueue";
import { useLeaveWarning } from "./useLeaveWarning";

function LeaveWarning() {
  useLeaveWarning();
  return null;
}

/** 탭을 닫거나 새로고침할 때처럼 beforeunload를 보내고, 브라우저가 확인 창을 띄울지(기본 동작 취소) 돌려준다. */
function tryToLeave() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useLeaveWarning", () => {
  it("[SPEC-005 R-14] 업로드 중이면 탭을 닫거나 새로고침할 때 떠날지 묻는다", () => {
    server.use(...mediaHandlers({ storageGate: new Promise(() => {}) }));
    render(<LeaveWarning />);

    act(() => {
      addFiles([new File([new Uint8Array(10)], "a.mp4")]);
    });

    expect(tryToLeave()).toBe(true);
  });

  it("[SPEC-005 R-14] 올리거나 기다리는 파일이 없으면 묻지 않는다", () => {
    render(<LeaveWarning />);

    act(() => {
      addFiles([new File([new Uint8Array(10)], "a.gif")]);
    });

    expect(tryToLeave()).toBe(false);
  });
});
