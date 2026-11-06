import { fireEvent, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ANALYSIS_API,
  ANALYSIS_SOURCE_ID,
  analysisHandlers,
  notAnalyzedSummaryBody,
  sourceSummaryBody,
} from "../../../../mocks/analysis";
import { sourceCompletedBody, sseServer } from "../../../../mocks/notifications";
import { handlers, MEDIA_API, mediaHandlers, problem, videoBody } from "../../../../mocks/handlers";
import { renderRoute } from "../../../../tests/render";
import { server } from "../../../../tests/server";
import { startSession } from "../../../shared/api/session";

const DETAIL_PATH = `/analysis/videos/${ANALYSIS_SOURCE_ID}`;

function videoServer(...extra: Parameters<typeof server.use>) {
  const requested: string[] = [];
  server.events.on("request:start", ({ request }) => {
    requested.push(new URL(request.url).pathname);
  });
  server.use(
    ...extra,
    handlers.me(),
    http.get(`${MEDIA_API}/:id`, () =>
      HttpResponse.json(
        videoBody({ id: ANALYSIS_SOURCE_ID, fileName: "crane.mp4", status: "READY" }),
      ),
    ),
    ...mediaHandlers(),
  );
  startSession("access-1");
  return requested;
}

describe("AnalysisResults", () => {
  it("[SPEC-031 R-1] 분석 결과가 없는 영상이면 안내만 보이고 이벤트·위험·스냅샷은 묻지 않는다", async () => {
    const requested = videoServer(
      http.get(`${ANALYSIS_API}/sources/:id/summary`, () =>
        HttpResponse.json(notAnalyzedSummaryBody()),
      ),
      ...analysisHandlers(),
    );
    renderRoute(DETAIL_PATH);

    expect(await screen.findByText("아직 분석 결과가 없습니다.")).toBeVisible();
    expect(screen.queryByRole("region", { name: "분석 요약" })).not.toBeInTheDocument();
    expect(requested.filter((path) => /\/(events|risks|snapshots)$/.test(path))).toEqual([]);
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-1] 분석이 끝난 영상이면 요약 패널과 결과 패널을 보인다", async () => {
    videoServer(...analysisHandlers());
    renderRoute(DETAIL_PATH);

    expect(await screen.findByRole("region", { name: "분석 요약" })).toBeVisible();
    expect(screen.getByRole("region", { name: "이벤트" })).toBeVisible();
    expect(screen.getByRole("region", { name: "위험 상태" })).toBeVisible();
    expect(screen.getByRole("region", { name: "상태 스냅샷" })).toBeVisible();
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-4] 진행 막대 위 이벤트 표시를 누르면 그 이벤트 상세가 열리고 seekMs로 간다", async () => {
    videoServer(...analysisHandlers());
    const { user } = renderRoute(DETAIL_PATH);
    const video = await screen.findByLabelText<HTMLVideoElement>("crane.mp4 재생");
    Object.defineProperty(video, "duration", { configurable: true, value: 600 });
    fireEvent.durationChange(video);
    await screen.findByRole("region", { name: "분석 요약" });

    const markers = await screen.findByRole("list", { name: "이벤트 표시" });
    await user.click(within(markers).getByRole("button", { name: "보호구 미착용 01:35 보통" }));

    expect(await screen.findByRole("region", { name: "이벤트 상세" })).toBeVisible();
    await screen.findByText("안전관리자 확인 필요");
    expect(video.currentTime).toBe(93);
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-17] 분석 API가 404면 영상을 찾을 수 없다는 안내를 보인다", async () => {
    videoServer(
      http.get(`${ANALYSIS_API}/sources/:id/summary`, () =>
        problem(404, "ANALYSIS_SOURCE_NOT_FOUND"),
      ),
    );
    renderRoute(DETAIL_PATH);

    expect(await screen.findByText("영상을 찾을 수 없습니다.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-17] 5xx·네트워크 오류면 다시 시도 버튼을 보이고 누르면 다시 묻는다", async () => {
    let failing = true;
    videoServer(
      http.get(`${ANALYSIS_API}/sources/:id/summary`, () =>
        failing ? HttpResponse.error() : HttpResponse.json(notAnalyzedSummaryBody()),
      ),
    );
    const { user } = renderRoute(DETAIL_PATH);

    expect(await screen.findByText("분석 결과를 불러오지 못했습니다.")).toBeVisible();
    failing = false;
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("아직 분석 결과가 없습니다.")).toBeVisible();
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-17] 이벤트 API 하나가 실패해도 요약은 보이고 그 패널에만 오류를 보인다", async () => {
    videoServer(
      http.get(`${ANALYSIS_API}/sources/:id/events`, () => problem(503, "ANALYSIS_UNAVAILABLE")),
      ...analysisHandlers(),
    );
    renderRoute(DETAIL_PATH);

    const events = await screen.findByRole("region", { name: "이벤트" });
    expect(
      await within(events).findByText("분석 결과를 잠시 불러올 수 없습니다. 다시 시도해 주세요."),
    ).toBeVisible();
    expect(within(events).getByRole("button", { name: "다시 시도" })).toBeVisible();
    expect(screen.getByRole("region", { name: "분석 요약" })).toBeVisible();
    server.events.removeAllListeners();
  });

  it("[SPEC-031 R-16] 열린 영상의 source.completed를 받으면 요약·이벤트·위험·스냅샷을 다시 불러온다", async () => {
    let analyzed = false;
    const sse = sseServer();
    const requested = videoServer(
      ...sse.handlers,
      http.get(`${ANALYSIS_API}/sources/:id/summary`, () =>
        HttpResponse.json(analyzed ? sourceSummaryBody() : notAnalyzedSummaryBody()),
      ),
      ...analysisHandlers(),
    );
    renderRoute(DETAIL_PATH);
    expect(await screen.findByText("아직 분석 결과가 없습니다.")).toBeVisible();
    await vi.waitFor(() => {
      expect(sse.connections).toHaveLength(1);
    });

    analyzed = true;
    sse.connections[0]?.send(sourceCompletedBody("0192f0d2-0000-7000-8000-000000000999"), "1");
    sse.connections[0]?.send(sourceCompletedBody(ANALYSIS_SOURCE_ID), "2");

    expect(await screen.findByRole("region", { name: "분석 요약" })).toBeVisible();
    await screen.findByRole("list", { name: "이벤트 목록" });
    await screen.findByRole("list", { name: "활성 위험" });
    const summaryRequests = requested.filter((path) => path.endsWith("/summary"));
    expect(summaryRequests.length).toBeGreaterThanOrEqual(2);
    server.events.removeAllListeners();
  });
});
