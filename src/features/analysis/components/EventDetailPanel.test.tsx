import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ANALYSIS_EVENT_ID,
  analysisHandlers,
  eventDetailBody,
  eventSummaryBody,
  vlmAnalysisBody,
} from "../../../../mocks/analysis";
import { ANALYSIS_DETAIL_PATH, renderAnalysisDetail } from "../../../../tests/analysisDetail";

const PLAYER = "crane.mp4 재생";

async function player() {
  return screen.findByLabelText<HTMLVideoElement>(PLAYER);
}

describe("EventDetailPanel", () => {
  it("[SPEC-031 R-5] 이벤트를 누르면 플레이어가 seekMs로 가고 주소에 남기며 상세가 열린다", async () => {
    const { user, router } = renderAnalysisDetail(analysisHandlers());
    const video = await player();
    const list = await screen.findByRole("list", { name: "이벤트 목록" });

    await user.click(within(list).getByRole("button", { name: /보호구 미착용/ }));

    expect(video.currentTime).toBe(93);
    expect(router.state.location.search).toBe(`?event=${ANALYSIS_EVENT_ID}`);
    const detail = await screen.findByRole("region", { name: "이벤트 상세" });
    expect(within(detail).getByText("안전모 미착용")).toBeVisible();
    expect(within(detail).getByText("안전관리자 확인 필요")).toBeVisible();
    expect(within(detail).getByText("작업을 멈추고 안전모를 지급한다.")).toBeVisible();
    expect(within(detail).getByText("rule+vlm")).toBeVisible();
    expect(within(detail).getByText(/event_judge/)).toBeVisible();
    expect(within(detail).getByText(/gpt-6.1-terra/)).toBeVisible();
  });

  it("[SPEC-031 R-5] 근거 프레임을 보이고 누르면 그 시각으로 간다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers(), {
      path: `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}`,
    });
    const video = await player();
    const frame = await screen.findByRole("img", { name: "근거 프레임 01:35" });

    await user.click(frame);

    expect(video.currentTime).toBe(95);
  });

  it("[SPEC-031 R-5] 주소의 ?event=로 바로 열면 상세가 열리고 플레이어가 그 이벤트의 seekMs로 간다", async () => {
    renderAnalysisDetail(analysisHandlers(), {
      path: `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}`,
    });

    expect(await screen.findByRole("region", { name: "이벤트 상세" })).toBeVisible();
    const video = await player();
    await screen.findByText("안전관리자 확인 필요");
    expect(video.currentTime).toBe(93);
  });

  it("[SPEC-031 R-5] 판정 결과 형식을 읽을 수 없으면 그 칸만 안내하고 나머지는 보인다", async () => {
    renderAnalysisDetail(
      analysisHandlers({
        details: [eventDetailBody({ analysis: { unexpected: true } })],
      }),
      { path: `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}` },
    );

    const detail = await screen.findByRole("region", { name: "이벤트 상세" });
    expect(await within(detail).findByText("판정 결과 형식을 읽을 수 없습니다.")).toBeVisible();
    expect(within(detail).getByText("rule+vlm")).toBeVisible();
  });

  it("[SPEC-031 R-6] 판정 모델이 없는 이벤트는 상세에서도 상태 안내를 설명 자리에 보인다", async () => {
    const event = eventSummaryBody({ verificationStatus: "unverified", description: null });
    renderAnalysisDetail(
      analysisHandlers({
        events: [event],
        details: [
          eventDetailBody({
            event,
            analysis: vlmAnalysisBody({
              verificationStatus: "unverified",
              eventDetected: null,
              description: null,
              riskDetected: null,
              riskType: null,
              riskReason: null,
              solution: null,
              severity: null,
            }),
          }),
        ],
      }),
      { path: `${ANALYSIS_DETAIL_PATH}?event=${ANALYSIS_EVENT_ID}` },
    );

    const detail = await screen.findByRole("region", { name: "이벤트 상세" });
    expect(
      await within(detail).findByText("판정 모델이 설정되지 않아 설명이 없습니다."),
    ).toBeVisible();
    expect(within(detail).queryByText("안전관리자 확인 필요")).not.toBeInTheDocument();
  });
});
