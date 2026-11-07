import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ANALYSIS_DETAIL_PATH, renderAnalysisDetail } from "../../tests/analysisDetail";
import { analysisHandlers } from "../../mocks/analysis";

describe("영상 상세의 시작 위치", () => {
  it("[SPEC-034 R-4] ?t=(ms)로 열면 플레이어를 그 시각으로 옮긴다", async () => {
    renderAnalysisDetail([...analysisHandlers()], { path: `${ANALYSIS_DETAIL_PATH}?t=65000` });

    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    await screen.findByRole("region", { name: "분석 요약" });
    expect(video.currentTime).toBe(65);
  });

  it("[SPEC-034 R-4] ?t=가 숫자가 아니면 무시한다", async () => {
    renderAnalysisDetail([...analysisHandlers()], { path: `${ANALYSIS_DETAIL_PATH}?t=abc` });

    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    await screen.findByRole("region", { name: "분석 요약" });
    expect(video.currentTime).toBe(0);
  });
});
