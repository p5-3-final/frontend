import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  ANALYSIS_API,
  ANALYSIS_SOURCE_ID,
  analysisHandlers,
  notAnalyzedSummaryBody,
} from "../../../../mocks/analysis";
import { handlers, MEDIA_API, mediaHandlers, videoBody } from "../../../../mocks/handlers";
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
});
