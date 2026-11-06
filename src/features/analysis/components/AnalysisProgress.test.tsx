import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ANALYSIS_SOURCE_ID, analysisHandlers } from "../../../../mocks/analysis";
import { jobStatusBody, sseServer } from "../../../../mocks/notifications";
import { renderAnalysisDetail } from "../../../../tests/analysisDetail";

const OTHER_SOURCE = "0192f0d2-0000-7000-8000-000000000999";

async function setUp(extra = analysisHandlers()) {
  const sse = sseServer();
  const view = renderAnalysisDetail([...sse.handlers, ...extra]);
  await vi.waitFor(() => {
    expect(sse.connections).toHaveLength(1);
  });
  return { ...view, connection: sse.connections[0] };
}

describe("AnalysisProgress", () => {
  it("[SPEC-031 R-15] 분석 결과가 없는 영상은 진행 알림 전까지 진행 상태 확인 중을 보인다", async () => {
    await setUp([]);
    expect(await screen.findByText("진행 상태 확인 중")).toBeVisible();
  });

  it("[SPEC-031 R-15] 열린 영상의 job.status로 진행률과 상태를 갱신하고 terminal이면 닫는다", async () => {
    const { connection } = await setUp([]);
    await screen.findByText("진행 상태 확인 중");

    connection?.send(jobStatusBody(ANALYSIS_SOURCE_ID, { progressPercent: 40 }), "1");
    const bar = await screen.findByRole("progressbar", { name: "분석 진행률" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByText("분석 중 40%")).toBeVisible();

    connection?.send(
      jobStatusBody(ANALYSIS_SOURCE_ID, {
        progressPercent: 100,
        status: "COMPLETED",
        terminal: true,
      }),
      "2",
    );
    await vi.waitFor(() => {
      expect(screen.queryByRole("progressbar", { name: "분석 진행률" })).not.toBeInTheDocument();
    });
    expect(screen.queryByText("진행 상태 확인 중")).not.toBeInTheDocument();
  });

  it("[SPEC-031 R-15] 다른 영상의 진행 알림은 무시한다", async () => {
    const { connection } = await setUp();
    await screen.findByRole("region", { name: "분석 요약" });

    connection?.send(jobStatusBody(OTHER_SOURCE, { progressPercent: 70 }), "1");
    connection?.send(jobStatusBody(ANALYSIS_SOURCE_ID, { progressPercent: 10 }), "2");

    const bar = await screen.findByRole("progressbar", { name: "분석 진행률" });
    expect(bar).toHaveAttribute("aria-valuenow", "10");
  });

  it("[SPEC-031 R-15] 화면이 뜨기 전에 온 진행 알림도 반영한다", async () => {
    const { connection } = await setUp([]);

    // 요약을 받기 전(진행 표시가 그려지기 전)에 온 알림
    connection?.send(jobStatusBody(ANALYSIS_SOURCE_ID, { progressPercent: 25 }), "1");

    const bar = await screen.findByRole("progressbar", { name: "분석 진행률" });
    expect(bar).toHaveAttribute("aria-valuenow", "25");
  });
});
