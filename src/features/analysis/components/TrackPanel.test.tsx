import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import {
  ANALYSIS_API,
  ANALYSIS_SOURCE_ID,
  analysisHandlers,
  eventSummaryBody,
} from "../../../../mocks/analysis";
import {
  INSPECT_REQUEST_ID,
  INSPECT_TRACK_ID,
  inspectResultBody,
  trackBody,
} from "../../../../mocks/inspect";
import { trackAnalyzedBody } from "../../../../mocks/notifications";
import { recordRequests, renderAnalysisDetail } from "../../../../tests/analysisDetail";
import { clickFrame, readyPlayer, renderWithNotifications } from "../../../../tests/inspect";

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

describe("TrackPanel 실시간 갱신", () => {
  it("[SPEC-032 R-5] 열린 트랙의 track.analyzed(click)가 오면 트랙을 다시 불러와 속성을 보인다", async () => {
    const { user, connection } = await renderWithNotifications(analysisHandlers());
    await readyPlayer();
    await clickFrame(user);
    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(within(panel).getByText("속성 분석 중")).toBeVisible();

    connection.send(
      trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
        requestId: INSPECT_REQUEST_ID,
        trackId: INSPECT_TRACK_ID,
        reason: "click",
      }),
    );

    expect(await within(panel).findByRole("group", { name: "안전모" })).toHaveTextContent("미착용");
  });

  it("[SPEC-032 R-5] 다른 트랙이나 질문 알림이면 트랙을 다시 부르지 않는다", async () => {
    const recorder = recordRequests();
    const { user, connection } = await renderWithNotifications(analysisHandlers());
    await readyPlayer();
    await clickFrame(user);
    await screen.findByRole("region", { name: "트랙 정보" });

    connection.send(
      trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
        requestId: INSPECT_REQUEST_ID,
        trackId: "0192f200-0000-5000-8000-000000000999",
        reason: "click",
      }),
    );
    connection.send(
      trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
        requestId: INSPECT_REQUEST_ID,
        trackId: INSPECT_TRACK_ID,
        reason: "question",
      }),
    );
    // 마지막 알림까지 처리했는지 확인할 기준으로, 같은 트랙의 event 알림을 하나 더 보낸다.
    connection.send(
      trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
        requestId: INSPECT_REQUEST_ID,
        trackId: INSPECT_TRACK_ID,
        reason: "event",
      }),
    );

    await screen.findByRole("group", { name: "안전모" });
    recorder.stop();
    expect(recorder.requests.filter((url) => url.pathname.includes("/tracks/"))).toHaveLength(1);
  });

  it("[SPEC-032 R-5] 알림이 클릭 조회 응답보다 먼저 와도 속성을 반영한다", async () => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { user, connection } = await renderWithNotifications([
      http.get(`${ANALYSIS_API}/sources/:sourceId/inspect`, async () => {
        await held;
        return HttpResponse.json(inspectResultBody());
      }),
      ...analysisHandlers(),
    ]);
    await readyPlayer();
    await clickFrame(user);

    connection.send(
      trackAnalyzedBody(ANALYSIS_SOURCE_ID, {
        requestId: INSPECT_REQUEST_ID,
        trackId: INSPECT_TRACK_ID,
        reason: "click",
      }),
    );
    // 알림을 받은 뒤에 응답을 보낸다.
    await screen.findByText("누른 위치의 객체를 찾는 중입니다.");
    await new Promise((resolve) => setTimeout(resolve, 50));
    release();

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(await within(panel).findByRole("group", { name: "안전모" })).toHaveTextContent("미착용");
  });
});

describe("TrackPanel 보호구 상태", () => {
  it("[SPEC-032 R-15] 트랙에 확정된 보호구 미착용 이벤트가 있으면 이벤트 결과를 먼저 보이고 속성은 보조로 내린다", async () => {
    const { user } = renderAnalysisDetail(
      analysisHandlers({ inspect: { inspect: inspectResultBody({ track: trackBody() }) } }),
    );
    await readyPlayer();
    await clickFrame(user);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    const status = await within(panel).findByRole("group", { name: "보호구 상태" });
    expect(status).toHaveTextContent("미착용 확정");
    expect(status).toHaveTextContent("크레인 하부에서 작업자가 안전모 없이 자재를 옮깁니다.");
    expect(within(panel).getByRole("heading", { name: "속성 분석(보조)" })).toBeVisible();
  });

  it("[SPEC-032 R-15] 확정 이벤트가 없으면 속성 값만 보호구 상태로 보인다", async () => {
    const { user } = renderAnalysisDetail(
      analysisHandlers({
        events: [eventSummaryBody({ verificationStatus: "unverified" })],
        inspect: { inspect: inspectResultBody({ track: trackBody() }) },
      }),
    );
    await readyPlayer();
    await clickFrame(user);

    const panel = await screen.findByRole("region", { name: "트랙 정보" });
    expect(await within(panel).findByRole("group", { name: "안전모" })).toHaveTextContent("미착용");
    expect(within(panel).queryByRole("group", { name: "보호구 상태" })).not.toBeInTheDocument();
    expect(
      within(panel).queryByRole("heading", { name: "속성 분석(보조)" }),
    ).not.toBeInTheDocument();
  });
});
