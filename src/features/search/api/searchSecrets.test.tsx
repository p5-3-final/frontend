import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { momentList, momentSearchBody, SEARCH_SOURCE_ID } from "../../../../mocks/search";
import { renderSearch, searchPath } from "../../../../tests/searchScreen";

// mocks/search.ts의 썸네일·주석 클립 서명 주소
const THUMB_SIGNATURE = "X-Amz-Signature=thumb-sig";
const CLIP_SIGNATURE = "X-Amz-Signature=clip-sig";
const QUERY = "안전모 안 쓴 작업자";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function browserStorage() {
  return [
    ...Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key) ?? ""}`),
    ...Object.keys(sessionStorage).map((key) => `${key}=${sessionStorage.getItem(key) ?? ""}`),
  ].join("\n");
}

describe("검색 질의와 서명 주소", () => {
  it("[SPEC-033 NFR-2] 질의·썸네일·클립 서명 주소를 URL 밖의 브라우저 저장소와 콘솔에 남기지 않고, 클립 주소는 창을 닫고 화면을 떠나면 버린다", async () => {
    const consoleCalls = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const results = momentList(1).map((moment) => ({
      ...moment,
      grounding: { ...moment.grounding, status: "READY" as const },
    }));
    const { user, router, queryClient, stopRecording } = renderSearch(
      searchPath({ q: QUERY, scope: "source", sourceId: SEARCH_SOURCE_ID }),
      { fixture: { sourceSearch: momentSearchBody({ results }) } },
    );
    await user.click(await screen.findByRole("button", { name: "주석 클립 보기" }));
    const dialog = await screen.findByRole("dialog", { name: "주석 클립" });
    expect(within(dialog).getByLabelText("주석 클립 재생")).toHaveAttribute(
      "src",
      expect.stringContaining(CLIP_SIGNATURE),
    );

    const stored = browserStorage();
    for (const secret of [QUERY, THUMB_SIGNATURE, CLIP_SIGNATURE]) {
      expect(stored).not.toContain(secret);
      for (const spy of consoleCalls) {
        expect(JSON.stringify(spy.mock.calls)).not.toContain(secret);
      }
    }

    await user.click(within(dialog).getByRole("button", { name: "닫기" }));
    await router.navigate("/events");
    await screen.findByRole("heading", { name: "이벤트" });
    await waitFor(() => {
      const cached = JSON.stringify(
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["search"] })
          .map((query) => query.state.data),
      );
      expect(cached).not.toContain(CLIP_SIGNATURE);
    });
    stopRecording();
  });
});
