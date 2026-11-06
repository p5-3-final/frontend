import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_EVENT_ID, ANALYSIS_SOURCE_ID, analysisHandlers } from "../../mocks/analysis";
import { renderAnalysisDetail } from "../../tests/analysisDetail";

describe("이벤트 메뉴에서 영상 상세로", () => {
  it("[SPEC-031 R-11] 이벤트를 누르면 그 영상 상세가 그 이벤트가 열린 상태로 열린다", async () => {
    const { user, router } = renderAnalysisDetail(analysisHandlers(), { path: "/events" });
    const list = await screen.findByRole("list", { name: "전체 이벤트" });

    await user.click(within(list).getByRole("link", { name: /보호구 미착용/ }));

    expect(router.state.location.pathname).toBe(`/analysis/videos/${ANALYSIS_SOURCE_ID}`);
    expect(router.state.location.search).toBe(`?event=${ANALYSIS_EVENT_ID}`);
    const detail = await screen.findByRole("region", { name: "이벤트 상세" });
    expect(await within(detail).findByText("안전관리자 확인 필요")).toBeVisible();
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    await waitFor(() => {
      expect(video.currentTime).toBe(93);
    });
  });
});
