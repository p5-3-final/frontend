import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { analysisHandlers } from "../../../../mocks/analysis";
import { inspectResultBody, trackBody } from "../../../../mocks/inspect";
import { recordRequests, renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { clickFrame, readyPlayer } from "../../../../tests/inspect";

describe("TrackPanel", () => {
  it('[SPEC-032 R-4] 속성 분석이 요청된 트랙이면 클래스·등장 구간과 "속성 분석 중"을 보이고 박스를 강조한다', async () => {
    const recorder = recordRequests();
    const { user } = renderAnalysisDetail(analysisHandlers());
    await readyPlayer();

    await clickFrame(user, 0.44, 0.3);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(within(panel).getByText("사람")).toBeVisible();
    expect(within(panel).getByRole("button", { name: /00:40 ~ 02:05/ })).toBeVisible();
    expect(within(panel).getByText("속성 분석 중")).toBeVisible();
    expect(screen.getByRole("img", { name: "선택한 객체 위치" })).toBeInTheDocument();
    const inspect = recorder.requests.find((url) => url.pathname.endsWith("/inspect"));
    recorder.stop();
    expect(inspect?.searchParams.get("tMs")).toBe("41000");
    expect(Number(inspect?.searchParams.get("x"))).toBeCloseTo(0.44);
    expect(Number(inspect?.searchParams.get("y"))).toBeCloseTo(0.3);
  });

  it("[SPEC-032 R-4] 속성이 있는 트랙이면 안전모·조끼·역할·장비·설명·판정 상태를 바로 보인다", async () => {
    const { user } = renderAnalysisDetail(
      analysisHandlers({
        events: [],
        inspect: { inspect: inspectResultBody({ track: trackBody() }) },
      }),
    );
    await readyPlayer();

    await clickFrame(user);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(within(panel).getByRole("group", { name: "안전모" })).toHaveTextContent("미착용");
    expect(within(panel).getByRole("group", { name: "안전조끼" })).toHaveTextContent(
      /^안전조끼착용$/,
    );
    expect(within(panel).getByRole("group", { name: "역할" })).toHaveTextContent("작업자");
    expect(within(panel).getByRole("group", { name: "장비" })).toHaveTextContent("없음");
    expect(within(panel).getByRole("group", { name: "판정 상태" })).toHaveTextContent("확인됨");
    expect(
      within(panel).getByText("주황색 안전조끼를 입고 안전모를 쓰지 않은 작업자"),
    ).toBeVisible();
  });

  it("[SPEC-032 R-4] 속성 분석이 실패한 트랙이면 실패 안내를 보인다", async () => {
    const { user } = renderAnalysisDetail(
      analysisHandlers({
        inspect: {
          inspect: inspectResultBody({
            track: trackBody({ attributeStatus: "FAILED", attributes: null }),
          }),
        },
      }),
    );
    await readyPlayer();

    await clickFrame(user);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(within(panel).getByText("속성을 분석하지 못했습니다.")).toBeVisible();
  });

  it("[SPEC-032 R-4] 등장 구간을 누르면 트랙이 처음 보인 시각으로 간다", async () => {
    const { user } = renderAnalysisDetail(analysisHandlers());
    const video = await readyPlayer();
    await clickFrame(user);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    await user.click(within(panel).getByRole("button", { name: /00:40 ~ 02:05/ }));

    expect(video.currentTime).toBe(40);
  });
});
