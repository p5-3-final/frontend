import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_EVENT_ID, analysisHandlers, snapshotBody } from "../../../../mocks/analysis";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";

describe("SnapshotList", () => {
  it("[SPEC-031 R-10] 상태 스냅샷을 시각 순으로 구역별 이전 → 현재로 보인다", async () => {
    renderAnalysisDetail(
      analysisHandlers({
        snapshots: [
          snapshotBody({ snapshotId: "s2", timestampMs: 100_000 }),
          snapshotBody({
            snapshotId: "s1",
            timestampMs: 40_000,
            zoneName: null,
            previousState: null,
            currentState: "방호벽 설치됨",
          }),
        ],
      }),
    );
    const panel = await screen.findByRole("region", { name: "상태 스냅샷" });

    const rows = within(await within(panel).findByRole("list")).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("00:40 · 전체: - → 방호벽 설치됨");
    expect(rows[1]).toHaveTextContent(
      "01:40 · A동 크레인 하부: 방호벽 설치됨 → 안전모 미착용 작업자 작업 중",
    );
  });

  it("[SPEC-031 R-10] 관련 이벤트를 누르면 그 이벤트 상세가 열리고 seekMs로 간다", async () => {
    const { user, router } = renderAnalysisDetail(analysisHandlers());
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    const panel = await screen.findByRole("region", { name: "상태 스냅샷" });

    await user.click(await within(panel).findByRole("button", { name: "01:40 관련 이벤트 보기" }));

    expect(router.state.location.search).toBe(`?event=${ANALYSIS_EVENT_ID}`);
    expect(await screen.findByRole("region", { name: "이벤트 상세" })).toBeVisible();
    await screen.findByText("안전관리자 확인 필요");
    expect(video.currentTime).toBe(93);
  });
});
