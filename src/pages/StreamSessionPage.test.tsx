import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { analysisHandlers } from "../../mocks/analysis";
import { handlers } from "../../mocks/handlers";
import { sessionBody, STREAM_SESSION_ID, streamHandlers } from "../../mocks/stream";
import { recordRequests } from "../../tests/analysisDetail";
import { renderRoute } from "../../tests/render";
import { server } from "../../tests/server";
import { startSession } from "../shared/api/session";

const PATH = `/stream/sessions/${STREAM_SESSION_ID}`;
let recorder: ReturnType<typeof recordRequests> | undefined;
afterEach(() => {
  recorder?.stop();
});

describe("실시간 세션 화면", () => {
  it("[SPEC-031 R-19] LIVE 세션이면 stream API의 현재 위험·타임라인·알림을 보인다", async () => {
    recorder = recordRequests();
    server.use(handlers.me(), ...streamHandlers(), ...analysisHandlers());
    startSession("access-1");
    renderRoute(PATH);

    expect(await screen.findByRole("heading", { name: "실시간 세션" })).toBeVisible();
    const risks = await screen.findByRole("region", { name: "현재 위험" });
    expect(await within(risks).findByText("쓰러진 작업자")).toBeVisible();
    const timeline = screen.getByRole("region", { name: "실시간 타임라인" });
    expect(
      await within(timeline).findByText("작업자 한 명이 바닥에 쓰러져 움직이지 않습니다."),
    ).toBeVisible();
    const alerts = screen.getByRole("region", { name: "긴급 알림" });
    expect(await within(alerts).findByText("쓰러짐")).toBeVisible();
    expect(screen.getByLabelText("실시간 영상 재생")).toHaveAttribute(
      "src",
      expect.stringContaining("index.m3u8"),
    );
    expect(recorder.requests.some((url) => url.pathname.includes("/api/v1/analysis/"))).toBe(false);
  });

  it("[SPEC-031 R-19] 닫힌 세션이면 analysis 결과를 보이고 라이브 조회를 하지 않는다", async () => {
    recorder = recordRequests();
    server.use(
      handlers.me(),
      ...streamHandlers({
        session: () => sessionBody({ status: "CLOSED", closedAt: "2026-11-06T12:00:00Z" }),
      }),
      ...analysisHandlers(),
    );
    startSession("access-1");
    renderRoute(PATH);

    expect(await screen.findByRole("region", { name: "분석 요약" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "현재 위험" })).not.toBeInTheDocument();
    expect(recorder.requests.some((url) => url.pathname.endsWith("/state"))).toBe(false);
  });
});
