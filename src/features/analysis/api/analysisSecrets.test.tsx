import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ANALYSIS_EVENT_ID, analysisHandlers } from "../../../../mocks/analysis";
import { ANALYSIS_DETAIL_PATH, renderAnalysisDetail } from "../../../../tests/analysisDetail";

// mocks/analysis.ts의 썸네일·근거 프레임 서명 주소
const SIGNATURE = "X-Amz-Signature=frame-sig";

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("분석 결과 서명 주소", () => {
  it("[SPEC-031 NFR-3] 근거 프레임·썸네일 서명 주소를 콘솔·브라우저 저장소에 남기지 않고, 화면을 떠나면 캐시에서 버린다", async () => {
    const consoleCalls = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const { router, queryClient } = renderAnalysisDetail(analysisHandlers(), {
      path: `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}`,
    });
    expect(await screen.findByRole("img", { name: "근거 프레임 01:35" })).toHaveAttribute(
      "src",
      expect.stringContaining(SIGNATURE),
    );

    const stored = [
      ...Object.keys(localStorage).map((key) => localStorage.getItem(key) ?? ""),
      ...Object.keys(sessionStorage).map((key) => sessionStorage.getItem(key) ?? ""),
    ].join("\n");
    expect(stored).not.toContain(SIGNATURE);
    for (const spy of consoleCalls) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain(SIGNATURE);
    }

    await router.navigate("/events");
    await screen.findByRole("heading", { name: "이벤트" });
    await waitFor(() => {
      const cached = JSON.stringify(
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ["analysis"] })
          .filter((query) => !query.queryKey.includes("my-events"))
          .map((query) => query.state.data),
      );
      expect(cached).not.toContain(SIGNATURE);
    });
  });
});
